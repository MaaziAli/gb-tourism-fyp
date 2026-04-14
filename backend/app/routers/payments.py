from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from app.database import get_db
from app.models.payment import Payment
from app.models.booking import Booking
from app.models.listing import Listing
from app.dependencies.auth import get_current_user
from app.utils.loyalty_utils import (
    get_or_create_account as _loyalty_account,
    pkr_to_points,
    points_to_pkr,
)
from app.utils.notify import create_notification

router = APIRouter(prefix="/payments", tags=["Payments"])

COMMISSION_RATE = 0.10  # 10% platform commission


class PaymentRequest(BaseModel):
    booking_id: int
    payment_method: str = "card"
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    card_name: Optional[str] = None


class ApplyLoyaltyRequest(BaseModel):
    booking_id: int
    points: int


class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    amount: float
    platform_commission: float
    provider_amount: float
    card_last4: Optional[str] = None
    message: str


@router.post("/apply-loyalty")
def apply_loyalty_discount(
    body: ApplyLoyaltyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Calculate the loyalty-points discount a user can apply at checkout.

    Read-only — nothing is committed to the database.  Points are
    only deducted when /payments/mock/confirm is called with
    loyalty_points_used set.

    Returns:
      points_to_use     – actual points after 50% cap
      discount_amount   – PKR value of those points
      new_payment_due   – (booking total + add-ons) minus discount
      available_points  – current balance
      remaining_after   – balance after this redemption
    """
    if body.points <= 0:
        raise HTTPException(status_code=400, detail="Points must be positive")

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == body.booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is cancelled")
    if getattr(booking, "payment_status", "unpaid") == "paid":
        raise HTTPException(status_code=400, detail="Booking is already paid")

    account = _loyalty_account(db, current_user.id)
    if body.points > account.total_points:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough points. "
                f"You have {account.total_points:,} available."
            ),
        )

    # Include any saved add-on costs in the cap so we don't over-discount
    addons_total = sum(
        item.get("price", 0) for item in (booking.addons or [])
    )
    base_amount = round(booking.total_price + addons_total, 2)
    max_discount = round(base_amount * 0.5, 2)

    raw_discount = points_to_pkr(body.points)
    discount = min(raw_discount, max_discount)
    usable_points = (
        pkr_to_points(discount) if discount < raw_discount else body.points
    )
    discount = round(discount, 2)

    return {
        "points_to_use": usable_points,
        "discount_amount": discount,
        "new_payment_due": round(max(0.0, base_amount - discount), 2),
        "available_points": account.total_points,
        "remaining_after": account.total_points - usable_points,
    }


@router.post("/process", response_model=PaymentResponse)
def process_payment(
    body: PaymentRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Get booking
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == body.booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(400, "Booking is cancelled")
    if getattr(booking, "payment_status", "unpaid") == "paid":
        raise HTTPException(400, "Already paid")

    # Simulate payment validation
    if body.payment_method == "card":
        if not body.card_number:
            raise HTTPException(400, "Card number required")
        # Simulate failure for test card
        clean = body.card_number.replace(" ", "")
        if clean == "4000000000000002":
            raise HTTPException(
                400,
                "Payment declined. Please try another card.",
            )

    amount = booking.total_price
    commission = round(amount * COMMISSION_RATE, 2)
    provider_amount = round(amount - commission, 2)

    # Generate transaction ID
    txn_id = "TXN-" + str(uuid.uuid4()).replace("-", "")[:12].upper()

    # Get last 4 digits
    card_last4 = None
    if body.card_number:
        clean = body.card_number.replace(" ", "")
        card_last4 = clean[-4:] if len(clean) >= 4 else None

    # Save payment record
    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=amount,
        platform_commission=commission,
        provider_amount=provider_amount,
        status="completed",
        payment_method=body.payment_method,
        card_last4=card_last4,
        transaction_id=txn_id,
    )
    db.add(payment)

    # Update booking payment status
    booking.payment_status = "paid"
    db.commit()

    # Notify traveler
    create_notification(
        db,
        user_id=current_user.id,
        title="Payment Successful 💳",
        message=(
            f"PKR {amount:,.0f} paid for booking. "
            f"Transaction ID: {txn_id}"
        ),
        type="success",
    )

    # Notify provider
    listing = (
        db.query(Listing).filter(Listing.id == booking.listing_id).first()
    )
    if listing:
        create_notification(
            db,
            user_id=listing.owner_id,
            title="Payment Received 💰",
            message=(
                f"PKR {provider_amount:,.0f} payment "
                f"received for booking #{booking.id}. "
                f"Platform fee: PKR {commission:,.0f}"
            ),
            type="success",
        )

    return PaymentResponse(
        success=True,
        transaction_id=txn_id,
        amount=amount,
        platform_commission=commission,
        provider_amount=provider_amount,
        card_last4=card_last4,
        message="Payment processed successfully",
    )


@router.get("/booking/{booking_id}")
def get_payment_status(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    payment = (
        db.query(Payment).filter(Payment.booking_id == booking_id).first()
    )
    if not payment:
        return {"paid": False}
    if payment.user_id != current_user.id:
        raise HTTPException(403, "Not your payment")
    return {
        "paid": payment.status == "completed",
        "transaction_id": payment.transaction_id,
        "amount": payment.amount,
        "platform_commission": payment.platform_commission,
        "provider_amount": payment.provider_amount,
        "card_last4": payment.card_last4,
        "payment_method": payment.payment_method,
        "created_at": payment.created_at.isoformat(),
    }


@router.get("/admin/summary")
def get_payment_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admins only")
    payments = db.query(Payment).filter(Payment.status == "completed").all()
    total_revenue = sum(p.amount for p in payments)
    total_commission = sum(p.platform_commission for p in payments)
    total_provider = sum(p.provider_amount for p in payments)
    return {
        "total_payments": len(payments),
        "total_revenue": total_revenue,
        "platform_commission": total_commission,
        "provider_payouts": total_provider,
    }


@router.get("/my-spending")
def get_my_spending(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Traveler: see all their payments"""
    payments = (
        db.query(Payment)
        .filter(
            Payment.user_id == current_user.id,
            Payment.status == "completed",
        )
        .order_by(Payment.created_at.desc())
        .all()
    )

    result = []
    for p in payments:
        booking = (
            db.query(Booking).filter(Booking.id == p.booking_id).first()
        )
        listing = (
            db.query(Listing).filter(Listing.id == booking.listing_id).first()
            if booking
            else None
        )
        result.append({
            "id": p.id,
            "transaction_id": p.transaction_id,
            "amount": p.amount,
            "payment_method": p.payment_method,
            "card_last4": p.card_last4,
            "created_at": p.created_at.isoformat(),
            "listing_title": listing.title if listing else "Unknown",
            "location": listing.location if listing else "",
            "check_in": (
                booking.check_in.isoformat()
                if booking and booking.check_in
                else None
            ),
            "check_out": (
                booking.check_out.isoformat()
                if booking and booking.check_out
                else None
            ),
        })
    total = sum(p.amount for p in payments)
    return {"payments": result, "total_spent": total}


@router.get("/provider-received")
def get_provider_payments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Provider: see payments received for listings"""
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(403, "Providers only")

    from app.models.user import User

    listings = (
        db.query(Listing).filter(Listing.owner_id == current_user.id).all()
    )
    listing_ids = [l.id for l in listings]
    listing_map = {l.id: l for l in listings}

    bookings = (
        db.query(Booking).filter(Booking.listing_id.in_(listing_ids)).all()
    )
    booking_map = {b.id: b for b in bookings}
    booking_ids = [b.id for b in bookings]

    payments = (
        db.query(Payment)
        .filter(
            Payment.booking_id.in_(booking_ids),
            Payment.status == "completed",
        )
        .order_by(Payment.created_at.desc())
        .all()
    )

    result = []
    for p in payments:
        booking = booking_map.get(p.booking_id)
        listing = (
            listing_map.get(booking.listing_id) if booking else None
        )
        traveler = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "id": p.id,
            "transaction_id": p.transaction_id,
            "total_amount": p.amount,
            "platform_fee": p.platform_commission,
            "you_receive": p.provider_amount,
            "payment_method": p.payment_method,
            "created_at": p.created_at.isoformat(),
            "listing_title": listing.title if listing else "Unknown",
            "traveler_name": traveler.full_name if traveler else "Unknown",
            "check_in": (
                booking.check_in.isoformat()
                if booking and booking.check_in
                else None
            ),
            "check_out": (
                booking.check_out.isoformat()
                if booking and booking.check_out
                else None
            ),
        })

    total_received = sum(p.provider_amount for p in payments)
    total_fees = sum(p.platform_commission for p in payments)
    return {
        "payments": result,
        "total_received": total_received,
        "total_platform_fees": total_fees,
        "pending_note": "Payments are released after guest check-in",
    }


@router.get("/admin/all-payments")
def get_all_payments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Admin: see ALL payments with full details"""
    if current_user.role != "admin":
        raise HTTPException(403, "Admins only")

    from app.models.user import User

    payments = (
        db.query(Payment).order_by(Payment.created_at.desc()).all()
    )

    result = []
    for p in payments:
        booking = (
            db.query(Booking).filter(Booking.id == p.booking_id).first()
        )
        listing = (
            db.query(Listing).filter(Listing.id == booking.listing_id).first()
            if booking
            else None
        )
        traveler = (
            db.query(User).filter(User.id == p.user_id).first()
        )
        provider = (
            db.query(User).filter(User.id == listing.owner_id).first()
            if listing
            else None
        )

        result.append({
            "id": p.id,
            "transaction_id": p.transaction_id,
            "amount": p.amount,
            "platform_commission": p.platform_commission,
            "provider_amount": p.provider_amount,
            "status": p.status,
            "payment_method": p.payment_method,
            "card_last4": p.card_last4,
            "created_at": p.created_at.isoformat(),
            "listing_title": listing.title if listing else "Unknown",
            "traveler_name": traveler.full_name if traveler else "Unknown",
            "traveler_email": traveler.email if traveler else "",
            "provider_name": provider.full_name if provider else "Unknown",
        })

    total_volume = sum(p.amount for p in payments)
    total_commission = sum(p.platform_commission for p in payments)
    total_provider_paid = sum(p.provider_amount for p in payments)
    return {
        "payments": result,
        "total_volume": total_volume,
        "total_commission": total_commission,
        "total_provider_payouts": total_provider_paid,
        "total_transactions": len(payments),
    }
