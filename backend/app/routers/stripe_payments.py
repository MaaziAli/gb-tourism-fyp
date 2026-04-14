"""
Stripe Payment router — Checkout Sessions, webhooks, and verification.

Flow:
  1. POST /payments/stripe/create-session
       → creates a Stripe Checkout Session and returns the URL
  2. Frontend redirects user to stripe.com
  3. On success Stripe redirects → /payment/success?session_id=…
  4. GET  /payments/stripe/verify?session_id=…
       → backend confirms session, marks booking confirmed + payment paid
  5. POST /payments/stripe/webhook  (called by Stripe, not the browser)
       → secondary confirmation via signed webhook event
"""
import logging

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.payment import Payment
from app.models.user import User
from app.utils.addon_utils import validate_and_normalize_addons
from app.utils.loyalty_utils import (
    get_or_create_account,
    pkr_to_points,
    points_to_pkr,
    redeem_points_transactional,
)
from app.utils.notify import create_notification

stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/stripe", tags=["Stripe Payments"])

COMMISSION_RATE = 0.10


# ── helpers ─────────────────────────────────────────────────────────────────


def _confirm_booking(
    db: Session,
    booking_id: int,
    session_id: str,
    loyalty_points_used: int = 0,
    paid_amount: float | None = None,
    normalized_addons: list | None = None,
) -> Payment:
    """Mark booking confirmed and record/update the payment row.

    If loyalty_points_used > 0, the points are deducted atomically
    in the same db.commit() so neither half can succeed without the other.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError(f"Booking {booking_id} not found")

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()

    # Idempotency: skip if already confirmed
    existing = (
        db.query(Payment)
        .filter(Payment.stripe_session_id == session_id)
        .first()
    )
    if existing and existing.status == "completed":
        return existing

    amount = round(
        paid_amount if paid_amount is not None else booking.total_price,
        2,
    )
    commission = round(amount * COMMISSION_RATE, 2)
    provider_amount = round(amount - commission, 2)

    if existing:
        existing.status = "completed"
        existing.transaction_id = session_id
        payment = existing
    else:
        payment = Payment(
            booking_id=booking.id,
            user_id=booking.user_id,
            amount=amount,
            platform_commission=commission,
            provider_amount=provider_amount,
            status="completed",
            payment_method="stripe",
            stripe_session_id=session_id,
            transaction_id=session_id,
        )
        db.add(payment)

    booking.payment_status = "paid"
    booking.status = "confirmed"

    # Apply normalized addons if not already set
    if normalized_addons and not booking.addons:
        booking.addons = normalized_addons

    # Atomically deduct loyalty points in the same transaction
    if loyalty_points_used > 0:
        try:
            redeem_points_transactional(
                db,
                booking.user_id,
                loyalty_points_used,
                f"Stripe payment for Booking #{booking_id}",
                booking_id,
            )
        except ValueError as exc:
            db.rollback()
            raise ValueError(str(exc))

    db.commit()
    db.refresh(payment)

    # Notify traveler
    try:
        create_notification(
            db,
            user_id=booking.user_id,
            title="Payment Successful 🎉",
            message=(
                f"PKR {amount:,.0f} paid via Stripe for "
                f"'{listing.title if listing else 'your booking'}'. "
                f"Booking #{booking.id} is confirmed."
            ),
            type="success",
        )
        if listing:
            create_notification(
                db,
                user_id=listing.owner_id,
                title="New Payment Received 💰",
                message=(
                    f"PKR {provider_amount:,.0f} received for booking #{booking.id}. "
                    f"Platform fee: PKR {commission:,.0f}"
                ),
                type="success",
            )
    except Exception:
        pass

    return payment


# ── schemas ──────────────────────────────────────────────────────────────────


class AddonItem(BaseModel):
    id: int
    quantity: int = 1


class CreateSessionRequest(BaseModel):
    booking_id: int
    loyalty_points_used: int = 0
    addons: list[AddonItem] = []


class CreateSessionResponse(BaseModel):
    session_id: str
    checkout_url: str


# ── endpoints ────────────────────────────────────────────────────────────────


@router.post("/create-session", response_model=CreateSessionResponse)
def create_checkout_session(
    body: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a Stripe Checkout Session for a pending booking.
    Returns { session_id, checkout_url } — frontend redirects to checkout_url.
    """
    booking = (
        db.query(Booking)
        .filter(Booking.id == body.booking_id, Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot pay for a cancelled booking")
    if getattr(booking, "payment_status", "unpaid") == "paid":
        raise HTTPException(status_code=400, detail="Booking is already paid")

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
    listing_title = listing.title if listing else f"Booking #{booking.id}"

    nights = 1
    if booking.check_in and booking.check_out:
        nights = max(1, (booking.check_out - booking.check_in).days)
    guests = getattr(booking, "guests", 1) or 1

    # ── Add-ons ───────────────────────────────────────────────────────────
    normalized_addons: list = []
    addons_total = 0.0
    if body.addons:
        selected = [{"id": a.id, "quantity": a.quantity} for a in body.addons]
        normalized_addons, addons_total = validate_and_normalize_addons(
            db,
            listing_id=booking.listing_id,
            room_type_id=getattr(booking, "room_type_id", None),
            selected_addons=selected,
            nights=nights,
            guests=guests,
        )
        booking.total_price = round(booking.total_price + addons_total, 2)
        db.flush()

    # ── Loyalty discount ──────────────────────────────────────────────────
    loyalty_discount = 0.0
    usable_points = 0
    if body.loyalty_points_used > 0:
        account = get_or_create_account(db, current_user.id)
        if account.total_points < body.loyalty_points_used:
            raise HTTPException(status_code=400, detail="Insufficient loyalty points")
        # Cap: user cannot discount more than 50% of the booking total
        max_discount = booking.total_price * 0.5
        max_points = pkr_to_points(max_discount)
        usable_points = min(body.loyalty_points_used, max_points)
        loyalty_discount = points_to_pkr(usable_points)

    final_amount = max(0.0, booking.total_price - loyalty_discount)

    # Amount in paisa (PKR → smallest unit, 1 PKR = 100 paisa)
    # Stripe requires an integer; minimum 1 paisa to avoid Stripe rejecting 0.
    amount_paisa = max(1, int(round(final_amount * 100)))

    # Build a human-readable discount note for the Stripe description
    discount_note = (
        f"  |  Loyalty discount: PKR {loyalty_discount:,.0f} ({usable_points:,} pts)"
        if usable_points > 0
        else ""
    )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "pkr",
                        "product_data": {
                            "name": listing_title,
                            "description": (
                                f"Check-in: {booking.check_in}  "
                                f"Check-out: {booking.check_out}  "
                                f"({nights} night{'s' if nights != 1 else ''})"
                                f"{discount_note}"
                            ),
                        },
                        "unit_amount": amount_paisa,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=(
                f"{settings.FRONTEND_URL}/payment/success"
                f"?session_id={{CHECKOUT_SESSION_ID}}"
                f"&booking_id={booking.id}"
            ),
            cancel_url=(
                f"{settings.FRONTEND_URL}/payment/cancel"
                f"?booking_id={booking.id}"
            ),
            metadata={
                "booking_id": str(booking.id),
                "user_id": str(current_user.id),
                "loyalty_points_used": str(usable_points),
                "amount_paid_pkr": f"{final_amount:.2f}",
                "has_addons": "1" if normalized_addons else "0",
            },
            customer_email=current_user.email,
        )
    except stripe.error.StripeError as exc:
        logger.error("Stripe session creation failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(exc)}")

    # Pre-create a pending payment row so we can track it
    pending = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=round(final_amount, 2),
        platform_commission=round(final_amount * COMMISSION_RATE, 2),
        provider_amount=round(final_amount * (1 - COMMISSION_RATE), 2),
        status="pending",
        payment_method="stripe",
        stripe_session_id=session.id,
    )
    db.add(pending)
    # Store normalized addons on booking now (before payment completes)
    if normalized_addons and not booking.addons:
        booking.addons = normalized_addons
    db.commit()

    return CreateSessionResponse(session_id=session.id, checkout_url=session.url)


@router.get("/verify")
def verify_payment(
    session_id: str,
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by the frontend after Stripe redirects to /payment/success.
    Retrieves the Stripe session, confirms it is paid, and finalises the booking.
    """
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(exc)}")

    if session.payment_status != "paid":
        raise HTTPException(
            status_code=402,
            detail=f"Payment not completed (status: {session.payment_status})",
        )

    # Read loyalty points stored in session metadata at creation time
    loyalty_points = int(session.metadata.get("loyalty_points_used") or 0)
    amount_paid = (
        round(session.amount_total / 100.0, 2)
        if getattr(session, "amount_total", None) is not None
        else None
    )
    if amount_paid is None and session.metadata.get("amount_paid_pkr"):
        amount_paid = float(session.metadata["amount_paid_pkr"])

    try:
        payment = _confirm_booking(
            db,
            booking_id,
            session_id,
            loyalty_points_used=loyalty_points,
            paid_amount=amount_paid,
            normalized_addons=booking.addons or [],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()

    return {
        "success": True,
        "booking_id": booking.id,
        "amount": payment.amount,
        "transaction_id": payment.transaction_id,
        "loyalty_points_used": int(
            getattr(booking, "loyalty_points_used", 0) or 0
        ),
        "loyalty_discount_applied": float(
            getattr(booking, "loyalty_discount_applied", 0.0) or 0.0
        ),
        "listing_title": listing.title if listing else "Your booking",
        "check_in": booking.check_in.isoformat() if booking.check_in else None,
        "check_out": booking.check_out.isoformat() if booking.check_out else None,
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    """
    Stripe webhook endpoint (signed). Register at:
    https://dashboard.stripe.com/webhooks

    Events handled:
      - checkout.session.completed  → confirm booking
      - payment_intent.payment_failed → log failure
    """
    payload = await request.body()

    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    if not webhook_secret or webhook_secret.startswith("whsec_your"):
        # Webhook secret not configured — skip signature validation in dev
        try:
            event = stripe.Event.construct_from(
                stripe.util.convert_to_stripe_object(
                    stripe.util.json.loads(payload.decode("utf-8"))
                ),
                stripe.api_key,
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    else:
        try:
            event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid Stripe signature")
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("payment_status") == "paid":
            booking_id = int(session.get("metadata", {}).get("booking_id", 0))
            loyalty_points = int(
                session.get("metadata", {}).get("loyalty_points_used", 0)
            )
            amount_total = session.get("amount_total")
            amount_paid = (
                round(amount_total / 100.0, 2)
                if amount_total is not None
                else None
            )
            if booking_id:
                try:
                    wb_booking = db.query(Booking).filter(Booking.id == booking_id).first()
                    _confirm_booking(
                        db,
                        booking_id,
                        session["id"],
                        loyalty_points_used=loyalty_points,
                        paid_amount=amount_paid,
                        normalized_addons=wb_booking.addons if wb_booking else [],
                    )
                    logger.info("Webhook confirmed booking %s", booking_id)
                except Exception as exc:
                    logger.error("Webhook booking confirm error: %s", exc)

    elif event["type"] == "payment_intent.payment_failed":
        pi = event["data"]["object"]
        logger.warning("Payment failed for intent %s", pi.get("id"))

    return {"received": True}


@router.get("/config")
def get_stripe_config():
    """Return the Stripe publishable key for the frontend."""
    return {"publishable_key": settings.STRIPE_PUBLISHABLE_KEY}
