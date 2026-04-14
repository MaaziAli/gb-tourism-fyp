"""
Mock Payment Router — university prototype only.
No real money is processed. Calling /confirm simply marks the booking
confirmed and records a fake transaction ID.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.payment import Payment
from app.models.user import User
from app.utils.notify import create_notification

router = APIRouter(prefix="/payments/mock", tags=["Mock Payment"])

COMMISSION_RATE = 0.10


@router.post("/confirm/{booking_id}")
def mock_confirm_payment(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simulate a successful payment — no real money involved.
    Updates the booking to confirmed and creates a payment record.
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
            "transaction_id": existing.transaction_id if existing else booking.payment_intent_id,
        }

    addons = booking.addons or []
    addons_total = sum(item.get("price", 0) for item in addons)
    total = round(float(booking.total_price) + addons_total, 2)
    commission = round(total * COMMISSION_RATE, 2)
    provider_amount = round(total - commission, 2)

    transaction_id = f"mock_{uuid.uuid4().hex}"

    # Update booking
    booking.status = "confirmed"
    booking.payment_status = "paid"
    booking.payment_intent_id = transaction_id
    booking.hold_expires_at = None

    # Record payment
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
    db.commit()

    # Notify traveler
    try:
        listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
        create_notification(
            db,
            user_id=current_user.id,
            title="Payment Successful",
            message=(
                f"PKR {total:,.0f} paid for "
                f"'{listing.title if listing else 'your booking'}'. "
                f"Booking #{booking.id} is confirmed."
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
    }
