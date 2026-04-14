"""
Mock Payment Router — university prototype only.
No real money is processed. Calling /confirm simply marks the booking
confirmed and records a fake transaction ID.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.payment import Payment
from app.models.user import User
from app.utils.addon_utils import calculate_nights, validate_and_normalize_addons
from app.utils.loyalty_utils import (
    get_or_create_account as _loyalty_account,
    pkr_to_points,
    points_to_pkr,
    redeem_points_transactional,
)
from app.utils.notify import create_notification

router = APIRouter(prefix="/payments/mock", tags=["Mock Payment"])

COMMISSION_RATE = 0.10


class MockConfirmBody(BaseModel):
    """Optional body for /mock/confirm — carries loyalty redemption info."""
    loyalty_points_used: int = 0
    addons: list[dict] = Field(default_factory=list)


@router.post("/confirm/{booking_id}")
def mock_confirm_payment(
    booking_id: int,
    body: MockConfirmBody = Body(default_factory=MockConfirmBody),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simulate a successful payment — no real money involved.

    Atomically:
      1. Updates booking → confirmed / paid
      2. Creates a Payment record (amount already net of loyalty discount)
      3. If loyalty_points_used > 0, stages the deduction via
         redeem_points_transactional() before the single db.commit()
         so the whole thing rolls back together if redemption fails.
    """
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Already confirmed — idempotent
    if booking.status == "confirmed" and booking.payment_status == "paid":
        existing = (
            db.query(Payment)
            .filter(Payment.booking_id == booking_id, Payment.status == "completed")
            .first()
        )
        return {
            "message": "Booking already confirmed",
            "booking_id": booking.id,
            "transaction_id": (
                existing.transaction_id if existing else booking.payment_intent_id
            ),
        }

    selected_addons = body.addons or booking.addons or []
    nights = calculate_nights(booking.check_in, booking.check_out)
    guests = max(1, int(getattr(booking, "group_size", 1) or 1))
    addons, addons_total = validate_and_normalize_addons(
        db,
        listing_id=booking.listing_id,
        room_type_id=getattr(booking, "room_type_id", None),
        selected_addons=selected_addons,
        nights=nights,
        guests=guests,
    )
    booking.addons = addons
    base_total = round(float(booking.total_price) + addons_total, 2)

    # ── Loyalty discount at payment time ─────────────────────────────────
    # The user may have points they didn't use at booking-creation time.
    # We cap at 50% of base_total and validate their balance.
    loyalty_pts = body.loyalty_points_used if body else 0
    loyalty_discount = 0.0
    if loyalty_pts > 0:
        account = _loyalty_account(db, current_user.id)
        if loyalty_pts > account.total_points:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough loyalty points. "
                    f"You have {account.total_points:,} available."
                ),
            )
        max_discount = round(base_total * 0.5, 2)
        raw_discount = points_to_pkr(loyalty_pts)
        loyalty_discount = min(raw_discount, max_discount)
        if loyalty_discount < raw_discount:
            loyalty_pts = pkr_to_points(loyalty_discount)
        loyalty_discount = round(loyalty_discount, 2)

    total = round(max(0.0, base_total - loyalty_discount), 2)
    commission = round(total * COMMISSION_RATE, 2)
    provider_amount = round(total - commission, 2)

    transaction_id = f"mock_{uuid.uuid4().hex}"

    # ── Stage all writes (no commit yet) ─────────────────────────────────
    booking.status = "confirmed"
    booking.payment_status = "paid"
    booking.payment_intent_id = transaction_id
    booking.hold_expires_at = None

    mock_payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=total,
        platform_commission=commission,
        provider_amount=provider_amount,
        status="completed",
        payment_method="mock",
        transaction_id=transaction_id,
    )
    db.add(mock_payment)

    # Stage loyalty deduction in the same transaction
    if loyalty_pts > 0:
        listing_for_desc = db.query(Listing).filter(
            Listing.id == booking.listing_id
        ).first()
        try:
            redeem_points_transactional(
                db,
                user_id=current_user.id,
                points=loyalty_pts,
                description=(
                    f"Redeemed at checkout for booking #{booking.id} "
                    f"at '{listing_for_desc.title if listing_for_desc else 'property'}' "
                    f"(saved PKR {loyalty_discount:,.0f})"
                ),
                reference_id=booking.id,
            )
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(exc))

    # ── Single atomic commit ──────────────────────────────────────────────
    db.commit()

    # Notify traveler
    try:
        listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
        loyalty_note = (
            f" Saved PKR {loyalty_discount:,.0f} with loyalty points."
            if loyalty_discount > 0
            else ""
        )
        create_notification(
            db,
            user_id=current_user.id,
            title="Payment Successful",
            message=(
                f"PKR {total:,.0f} paid for "
                f"'{listing.title if listing else 'your booking'}'. "
                f"Booking #{booking.id} is confirmed.{loyalty_note}"
            ),
            type="success",
        )
        if listing:
            create_notification(
                db,
                user_id=listing.owner_id,
                title="New Booking Confirmed",
                message=(
                    f"Booking #{booking.id} confirmed. "
                    f"PKR {provider_amount:,.0f} will be paid out after check-in."
                ),
                type="success",
            )
    except Exception:
        pass

    return {
        "message": "Payment successful",
        "booking_id": booking.id,
        "transaction_id": transaction_id,
        "amount": total,
        "loyalty_discount": loyalty_discount,
        "loyalty_points_used": loyalty_pts,
    }
