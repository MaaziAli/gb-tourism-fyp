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
from app.utils.notify import create_notification

stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/stripe", tags=["Stripe Payments"])

COMMISSION_RATE = 0.10


# ── helpers ─────────────────────────────────────────────────────────────────


def _confirm_booking(db: Session, booking_id: int, session_id: str) -> Payment:
    """Mark booking confirmed and record/update the payment row."""
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

    amount = booking.total_price
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


class CreateSessionRequest(BaseModel):
    booking_id: int


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

    # Amount in paisa (PKR → smallest unit, 1 PKR = 100 paisa)
    # Stripe requires integer cents; for PKR we use paise.
    amount_paisa = int(round(booking.total_price * 100))

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
        amount=booking.total_price,
        platform_commission=round(booking.total_price * COMMISSION_RATE, 2),
        provider_amount=round(booking.total_price * (1 - COMMISSION_RATE), 2),
        status="pending",
        payment_method="stripe",
        stripe_session_id=session.id,
    )
    db.add(pending)
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

    payment = _confirm_booking(db, booking_id, session_id)
    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()

    return {
        "success": True,
        "booking_id": booking.id,
        "amount": payment.amount,
        "transaction_id": payment.transaction_id,
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
            if booking_id:
                try:
                    _confirm_booking(db, booking_id, session["id"])
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
