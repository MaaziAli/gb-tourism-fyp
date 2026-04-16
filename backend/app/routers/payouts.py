from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.payment import Payment
from app.models.payout_request import PayoutRequest
from app.models.refund import Refund
from app.models.user import User

router = APIRouter(tags=["Payouts"])


class PayoutRequestCreate(BaseModel):
    amount: float
    notes: Optional[str] = None


class PayoutActionBody(BaseModel):
    notes: Optional[str] = None


def _ensure_provider(user: User):
    if user.role not in ["provider", "admin"]:
        raise HTTPException(status_code=403, detail="Providers only")


def get_provider_balance_breakdown(db: Session, provider_id: int) -> dict:
    total_earned = (
        db.query(func.coalesce(func.sum(Payment.provider_amount), 0.0))
        .join(Booking, Booking.id == Payment.booking_id)
        .join(Listing, Listing.id == Booking.listing_id)
        .filter(
            Listing.owner_id == provider_id,
            Payment.status == "completed",
        )
        .scalar()
        or 0.0
    )

    reserved_pending = (
        db.query(func.coalesce(func.sum(PayoutRequest.amount), 0.0))
        .filter(
            PayoutRequest.provider_id == provider_id,
            PayoutRequest.status == "pending",
        )
        .scalar()
        or 0.0
    )
    reserved_approved = (
        db.query(func.coalesce(func.sum(PayoutRequest.amount), 0.0))
        .filter(
            PayoutRequest.provider_id == provider_id,
            PayoutRequest.status == "approved",
        )
        .scalar()
        or 0.0
    )
    already_paid = (
        db.query(func.coalesce(func.sum(PayoutRequest.amount), 0.0))
        .filter(
            PayoutRequest.provider_id == provider_id,
            PayoutRequest.status == "paid",
        )
        .scalar()
        or 0.0
    )

    total_refunded = (
        db.query(func.coalesce(func.sum(Refund.amount_refunded), 0.0))
        .join(Booking, Booking.id == Refund.booking_id)
        .join(Listing, Listing.id == Booking.listing_id)
        .filter(Listing.owner_id == provider_id)
        .scalar()
        or 0.0
    )

    total_earned = round(float(total_earned), 2)
    total_refunded = round(float(total_refunded), 2)
    reserved_pending = round(float(reserved_pending), 2)
    reserved_approved = round(float(reserved_approved), 2)
    already_paid = round(float(already_paid), 2)
    total_reserved = round(reserved_pending + reserved_approved + already_paid, 2)
    available = round(max(0.0, total_earned - total_reserved - total_refunded), 2)

    return {
        "total_earned": total_earned,
        "total_refunded": total_refunded,
        "reserved_pending": reserved_pending,
        "reserved_approved": reserved_approved,
        "already_paid": already_paid,
        "total_reserved": total_reserved,
        "available_balance": available,
    }


def get_provider_balance(db: Session, provider_id: int) -> float:
    return get_provider_balance_breakdown(db, provider_id)["available_balance"]


@router.post("/payments/request-payout")
def request_payout(
    body: PayoutRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider(current_user)

    amount = round(float(body.amount or 0), 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    balance = get_provider_balance(db, current_user.id)
    if amount > balance:
        raise HTTPException(
            status_code=400,
            detail=f"Requested amount exceeds available balance (PKR {balance:,.2f})",
        )

    payout = PayoutRequest(
        provider_id=current_user.id,
        amount=amount,
        status="pending",
        notes=body.notes.strip() if body.notes else None,
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)

    breakdown = get_provider_balance_breakdown(db, current_user.id)
    return {
        "message": "Payout request submitted",
        "available_balance": breakdown["available_balance"],
        "balance_breakdown": breakdown,
        "request": {
            "id": payout.id,
            "amount": payout.amount,
            "status": payout.status,
            "requested_at": payout.requested_at.isoformat() if payout.requested_at else None,
            "processed_at": payout.processed_at.isoformat() if payout.processed_at else None,
            "notes": payout.notes,
        },
    }


@router.get("/payments/payout-requests")
def list_my_payout_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_provider(current_user)

    requests = (
        db.query(PayoutRequest)
        .filter(PayoutRequest.provider_id == current_user.id)
        .order_by(PayoutRequest.requested_at.desc())
        .all()
    )

    breakdown = get_provider_balance_breakdown(db, current_user.id)
    return {
        "available_balance": breakdown["available_balance"],
        "balance_breakdown": breakdown,
        "requests": [
            {
                "id": r.id,
                "amount": r.amount,
                "status": r.status,
                "requested_at": r.requested_at.isoformat() if r.requested_at else None,
                "processed_at": r.processed_at.isoformat() if r.processed_at else None,
                "notes": r.notes,
            }
            for r in requests
        ],
    }


@router.get("/admin/payout-requests")
def admin_list_payout_requests(
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    query = (
        db.query(PayoutRequest, User.full_name, User.email)
        .join(User, User.id == PayoutRequest.provider_id)
        .order_by(PayoutRequest.requested_at.asc())
    )
    if status and status != "all":
        query = query.filter(PayoutRequest.status == status)

    rows = query.all()
    return [
        {
            "id": payout.id,
            "provider_id": payout.provider_id,
            "provider_name": provider_name,
            "provider_email": provider_email,
            "amount": payout.amount,
            "status": payout.status,
            "requested_at": payout.requested_at.isoformat() if payout.requested_at else None,
            "processed_at": payout.processed_at.isoformat() if payout.processed_at else None,
            "notes": payout.notes,
        }
        for payout, provider_name, provider_email in rows
    ]


@router.post("/admin/payout-requests/{request_id}/approve")
def admin_approve_payout(
    request_id: int,
    body: PayoutActionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    payout = db.query(PayoutRequest).filter(PayoutRequest.id == request_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    if payout.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    payout.status = "approved"
    payout.processed_at = datetime.utcnow()
    if body.notes is not None:
        payout.notes = body.notes.strip() or None
    db.commit()
    db.refresh(payout)
    return {"message": "Payout request approved", "request_id": payout.id, "status": payout.status}


@router.post("/admin/payout-requests/{request_id}/pay")
def admin_mark_payout_paid(
    request_id: int,
    body: PayoutActionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    payout = db.query(PayoutRequest).filter(PayoutRequest.id == request_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    if payout.status != "approved":
        raise HTTPException(status_code=400, detail="Only approved requests can be marked paid")

    payout.status = "paid"
    payout.processed_at = datetime.utcnow()
    if body.notes is not None:
        payout.notes = body.notes.strip() or None
    db.commit()
    db.refresh(payout)
    return {"message": "Payout request marked as paid", "request_id": payout.id, "status": payout.status}


@router.post("/admin/payout-requests/{request_id}/reject")
def admin_reject_payout(
    request_id: int,
    body: PayoutActionBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    payout = db.query(PayoutRequest).filter(PayoutRequest.id == request_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    if payout.status not in ["pending", "approved"]:
        raise HTTPException(status_code=400, detail="Only pending/approved requests can be rejected")

    payout.status = "rejected"
    payout.processed_at = datetime.utcnow()
    payout.notes = body.notes.strip() if body.notes else payout.notes
    db.commit()
    db.refresh(payout)
    return {"message": "Payout request rejected", "request_id": payout.id, "status": payout.status}
