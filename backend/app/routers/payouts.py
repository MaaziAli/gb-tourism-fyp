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
from app.models.user import User

router = APIRouter(tags=["Payouts"])

ACTIVE_PAYOUT_STATUSES = ["pending", "approved", "paid"]


class PayoutRequestCreate(BaseModel):
    amount: float
    notes: Optional[str] = None


class PayoutActionBody(BaseModel):
    notes: Optional[str] = None


def _ensure_provider(user: User):
    if user.role not in ["provider", "admin"]:
        raise HTTPException(status_code=403, detail="Providers only")


def get_provider_balance(db: Session, provider_id: int) -> float:
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

    reserved = (
        db.query(func.coalesce(func.sum(PayoutRequest.amount), 0.0))
        .filter(
            PayoutRequest.provider_id == provider_id,
            PayoutRequest.status.in_(ACTIVE_PAYOUT_STATUSES),
        )
        .scalar()
        or 0.0
    )

    return round(max(0.0, float(total_earned) - float(reserved)), 2)


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

    return {
        "message": "Payout request submitted",
        "available_balance": get_provider_balance(db, current_user.id),
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

    return {
        "available_balance": get_provider_balance(db, current_user.id),
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
