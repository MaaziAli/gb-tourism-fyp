"""
XPay Global Payment Router

Flow:
  1. POST /payments/xpay/create-hold/{booking_id}
       → Sets a 10-minute hold on the booking (status=pending_payment)
  2. POST /payments/xpay/create-payment-intent
       → Creates XPay transaction, returns iframe_url for redirect
  3. Frontend redirects user to XPay hosted checkout
  4. XPay calls POST /payments/xpay/webhook on success
       → Marks booking confirmed + payment_status=paid

Get your API keys: https://docs.xpaycheckout.com/developer-resources/getyourkeys
XPay Pay endpoint docs: https://xpayeg.github.io/docs/pay/
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional

import requests
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.payment import Payment
from app.models.user import User
from app.utils.addon_utils import calculate_nights, validate_and_normalize_addons
from app.utils.notify import create_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/xpay", tags=["XPay Payments"])

COMMISSION_RATE = 0.10
XPAY_BASE_URL = {
    "sandbox": "https://staging.xpayeg.com/api/transactions",
    "production": "https://api.xpayeg.com/api/transactions",
}


# ── Schemas ──────────────────────────────────────────────────────────────────


class AddonItem(BaseModel):
    id: int | None = None
    addon_id: int | None = None
    listing_addon_id: int | None = None
    name: str | None = None
    quantity: int = 1


class CreatePaymentIntentRequest(BaseModel):
    booking_id: int
    addons: Optional[List[AddonItem]] = Field(default_factory=list)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_xpay_url() -> str:
    env = settings.XPAY_ENVIRONMENT.lower()
    return XPAY_BASE_URL.get(env, XPAY_BASE_URL["sandbox"])


def _create_xpay_transaction(amount: float, booking: Booking, user: User) -> dict:
    """
    Call the XPay REST API to create a payment transaction.
    Returns the API response dict containing iframe_url / pay_url.

    XPay API reference: https://xpayeg.github.io/docs/pay/
    Replace the payload structure below to match the exact fields
    required by your XPay account/community configuration.
    """
    url = _get_xpay_url()
    headers = {
        "x-api-key": settings.XPAY_API_KEY,
        "Content-Type": "application/json",
    }

    listing = booking.listing
    listing_title = listing.title if listing else f"Booking #{booking.id}"

    payload = {
        "amount": int(amount * 100),          # in smallest currency unit (paisa)
        "currency": "PKR",
        "community_id": settings.XPAY_COMMUNITY_ID,
        "payment_for": f"Booking #{booking.id} – {listing_title}",
        "variable_amount": False,
        "callback_url": f"{settings.FRONTEND_URL}/checkout/success?booking_id={booking.id}",
        "failure_callback_url": f"{settings.FRONTEND_URL}/checkout/failed?booking_id={booking.id}",
        "custom_fields": {
            "booking_id": str(booking.id),
            "user_id": str(user.id),
            "user_email": user.email,
        },
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="XPay API timed out. Please try again.")
    except requests.exceptions.HTTPError as exc:
        logger.error("XPay API HTTP error: %s – %s", exc.response.status_code, exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=f"XPay API error ({exc.response.status_code}): {exc.response.text}",
        )
    except Exception as exc:
        logger.error("XPay API unexpected error: %s", exc)
        raise HTTPException(status_code=502, detail=f"XPay API error: {str(exc)}")


def _verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """Verify XPay webhook HMAC signature."""
    secret = settings.XPAY_WEBHOOK_SECRET
    if not secret or secret.startswith("whsec_your"):
        # Webhook secret not configured — skip in dev
        return True
    expected = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def _confirm_booking(db: Session, booking: Booking, transaction_id: str) -> Payment:
    """Mark booking confirmed and record the payment row."""
    # Idempotency guard
    existing = (
        db.query(Payment)
        .filter(Payment.transaction_id == transaction_id)
        .first()
    )
    if existing and existing.status == "completed":
        return existing

    amount = booking.total_price
    # Add add-ons to amount if present
    addons = booking.addons or []
    addons_total = sum(item.get("price", 0) for item in addons)
    total_charged = amount + addons_total

    commission = round(total_charged * COMMISSION_RATE, 2)
    provider_amount = round(total_charged - commission, 2)

    if existing:
        existing.status = "completed"
        existing.amount = total_charged
        existing.platform_commission = commission
        existing.provider_amount = provider_amount
        payment = existing
    else:
        payment = Payment(
            booking_id=booking.id,
            user_id=booking.user_id,
            amount=total_charged,
            platform_commission=commission,
            provider_amount=provider_amount,
            status="completed",
            payment_method="xpay",
            transaction_id=transaction_id,
        )
        db.add(payment)

    booking.payment_status = "paid"
    booking.status = "confirmed"
    booking.hold_expires_at = None
    db.commit()
    db.refresh(payment)

    # Notify traveler
    try:
        listing = booking.listing
        create_notification(
            db,
            user_id=booking.user_id,
            title="Payment Successful",
            message=(
                f"PKR {total_charged:,.0f} paid via XPay for "
                f"'{listing.title if listing else 'your booking'}'. "
                f"Booking #{booking.id} is confirmed."
            ),
            type="success",
        )
        if listing:
            create_notification(
                db,
                user_id=listing.owner_id,
                title="New Payment Received",
                message=(
                    f"PKR {provider_amount:,.0f} received for booking #{booking.id}. "
                    f"Platform fee: PKR {commission:,.0f}"
                ),
                type="success",
            )
    except Exception:
        pass

    return payment


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/create-hold/{booking_id}")
def create_hold(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Place a 10-minute hold on a booking to prevent double-booking.
    Must be called before creating a payment intent.
    """
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.status == "confirmed":
        raise HTTPException(status_code=400, detail="Booking already confirmed")
    if booking.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")

    # If an existing hold is still valid, just return its expiry
    if (
        booking.hold_expires_at
        and booking.hold_expires_at > datetime.utcnow()
        and booking.status == "pending_payment"
    ):
        return {"hold_expires_at": booking.hold_expires_at.isoformat()}

    booking.hold_expires_at = datetime.utcnow() + timedelta(minutes=10)
    booking.status = "pending_payment"
    db.commit()
    db.refresh(booking)

    return {"hold_expires_at": booking.hold_expires_at.isoformat()}


@router.post("/create-payment-intent")
def create_payment_intent(
    body: CreatePaymentIntentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create an XPay payment transaction for a held booking.
    Returns the hosted checkout URL to redirect the user to.
    """
    booking = db.get(Booking, body.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.status == "confirmed" or booking.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")

    # Verify hold is still active
    if not booking.hold_expires_at or booking.hold_expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Booking hold has expired. Please start the checkout again.",
        )

    # Calculate total including add-ons
    selected_addons = [a.model_dump() for a in (body.addons or [])]
    nights = calculate_nights(booking.check_in, booking.check_out)
    guests = max(1, int(getattr(booking, "group_size", 1) or 1))
    addons_list, addons_total = validate_and_normalize_addons(
        db,
        listing_id=booking.listing_id,
        room_type_id=getattr(booking, "room_type_id", None),
        selected_addons=selected_addons,
        nights=nights,
        guests=guests,
    )
    total_amount = float(booking.total_price) + addons_total

    # Persist add-ons on booking
    booking.addons = addons_list
    db.commit()

    # Call XPay API
    xpay_response = _create_xpay_transaction(total_amount, booking, current_user)

    # Extract transaction ID and redirect URL from XPay response
    # Adjust these keys to match your actual XPay API response shape
    transaction_id = (
        xpay_response.get("id")
        or xpay_response.get("transaction_id")
        or xpay_response.get("data", {}).get("id")
    )
    iframe_url = (
        xpay_response.get("iframe_url")
        or xpay_response.get("pay_url")
        or xpay_response.get("data", {}).get("iframe_url")
        or xpay_response.get("data", {}).get("pay_url")
    )

    if not iframe_url:
        logger.error("XPay response missing iframe_url: %s", xpay_response)
        raise HTTPException(
            status_code=502,
            detail="XPay did not return a checkout URL. Check your API key and community ID.",
        )

    if transaction_id:
        booking.payment_intent_id = str(transaction_id)
        db.commit()

    # Pre-create a pending payment record
    existing = (
        db.query(Payment).filter(Payment.booking_id == booking.id, Payment.status == "pending").first()
    )
    if not existing:
        pending = Payment(
            booking_id=booking.id,
            user_id=current_user.id,
            amount=total_amount,
            platform_commission=round(total_amount * COMMISSION_RATE, 2),
            provider_amount=round(total_amount * (1 - COMMISSION_RATE), 2),
            status="pending",
            payment_method="xpay",
            transaction_id=str(transaction_id) if transaction_id else None,
        )
        db.add(pending)
        db.commit()

    return {
        "payment_id": transaction_id,
        "iframe_url": iframe_url,
        "total_amount": total_amount,
        "addons": addons_list,
    }


@router.get("/booking-status/{booking_id}")
def get_booking_payment_status(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check whether a booking's payment has been completed."""
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    payment = (
        db.query(Payment)
        .filter(Payment.booking_id == booking_id, Payment.status == "completed")
        .first()
    )

    return {
        "paid": payment is not None,
        "booking_status": booking.status,
        "payment_status": booking.payment_status,
        "transaction_id": payment.transaction_id if payment else None,
        "amount": payment.amount if payment else booking.total_price,
    }


@router.post("/webhook")
async def xpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    XPay webhook endpoint.
    Register this URL in your XPay dashboard as the webhook callback.

    XPay sends a POST with payment result details.
    The exact event payload shape depends on your XPay account configuration.
    """
    payload = await request.body()
    signature = request.headers.get("x-signature") or request.headers.get("x-xpay-signature", "")

    if not _verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info("XPay webhook received: type=%s", event.get("type") or event.get("status"))

    # Handle payment success
    # XPay may use "payment.succeeded", "PAID", or similar — adjust to match their docs
    event_type = event.get("type") or event.get("status") or ""
    is_success = event_type.lower() in ("payment.succeeded", "paid", "success", "completed")

    if is_success:
        # Extract transaction ID and booking ID from the event payload
        transaction_id = (
            event.get("id")
            or event.get("transaction_id")
            or event.get("data", {}).get("id")
        )
        booking_id_raw = (
            event.get("custom_fields", {}).get("booking_id")
            or event.get("metadata", {}).get("booking_id")
            or event.get("data", {}).get("custom_fields", {}).get("booking_id")
        )

        if not booking_id_raw:
            logger.warning("XPay webhook: no booking_id in payload")
            return {"status": "ok"}

        try:
            booking_id = int(booking_id_raw)
        except (ValueError, TypeError):
            logger.warning("XPay webhook: invalid booking_id %s", booking_id_raw)
            return {"status": "ok"}

        booking = db.get(Booking, booking_id)
        if booking:
            try:
                _confirm_booking(db, booking, str(transaction_id or f"xpay-{booking_id}"))
                logger.info("XPay webhook: confirmed booking %s", booking_id)
            except Exception as exc:
                logger.error("XPay webhook: confirm error for booking %s: %s", booking_id, exc)
        else:
            logger.warning("XPay webhook: booking %s not found", booking_id)

    return {"status": "ok"}
