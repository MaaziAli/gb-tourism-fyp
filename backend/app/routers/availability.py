from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.availability import AvailabilityBlock
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User

router = APIRouter(
    prefix="/availability", tags=["Availability"]
)


class BlockDatesRequest(BaseModel):
    dates: List[str]
    reason: Optional[str] = "blocked"


class UnblockDatesRequest(BaseModel):
    dates: List[str]


def _booking_night_date_strings(booking: Booking) -> List[str]:
    """Dates where the guest occupies the listing (check_in <= d < check_out)."""
    ci, co = booking.check_in, booking.check_out
    if not ci or not co:
        return []
    if isinstance(ci, str):
        start = datetime.strptime(ci[:10], "%Y-%m-%d").date()
    else:
        start = ci
    if isinstance(co, str):
        end = datetime.strptime(co[:10], "%Y-%m-%d").date()
    else:
        end = co
    out = []
    cur = start
    while cur < end:
        out.append(cur.strftime("%Y-%m-%d"))
        cur += timedelta(days=1)
    return out


@router.get("/{listing_id}/range")
def get_availability_range(
    listing_id: int,
    months_ahead: int = 3,
    db: Session = Depends(get_db),
):
    """Get blocked date strings for the next N months (manual + bookings)."""
    today = date.today()
    end_day = today + timedelta(days=max(1, months_ahead) * 31 + 5)
    all_blocked: set[str] = set()

    blocks = db.query(AvailabilityBlock).filter(
        AvailabilityBlock.listing_id == listing_id
    ).all()
    for b in blocks:
        try:
            d = datetime.strptime(b.block_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        if today <= d <= end_day:
            all_blocked.add(b.block_date)

    bookings = db.query(Booking).filter(
        Booking.listing_id == listing_id,
        Booking.status != "cancelled",
    ).all()
    for booking in bookings:
        for ds in _booking_night_date_strings(booking):
            try:
                d = datetime.strptime(ds, "%Y-%m-%d").date()
            except ValueError:
                continue
            if today <= d <= end_day:
                all_blocked.add(ds)

    return sorted(all_blocked)


@router.get("/{listing_id}")
def get_availability(
    listing_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Public — blocked/booked dates for a listing month."""
    now = datetime.now()
    y = year if year is not None else now.year
    m = month if month is not None else now.month
    prefix = f"{y}-{str(m).zfill(2)}"

    manual_blocks = (
        db.query(AvailabilityBlock)
        .filter(
            AvailabilityBlock.listing_id == listing_id,
            AvailabilityBlock.block_date.like(f"{prefix}%"),
        )
        .all()
    )

    blocked_dates = [
        {
            "date": b.block_date,
            "reason": b.reason or "blocked",
            "type": "manual",
        }
        for b in manual_blocks
    ]

    bookings = db.query(Booking).filter(
        Booking.listing_id == listing_id,
        Booking.status != "cancelled",
    ).all()

    booked_set: set[str] = set()
    for booking in bookings:
        for ds in _booking_night_date_strings(booking):
            if ds.startswith(prefix):
                booked_set.add(ds)

    for d in sorted(booked_set):
        blocked_dates.append({
            "date": d,
            "reason": "booked",
            "type": "booking",
        })

    return {
        "listing_id": listing_id,
        "year": y,
        "month": m,
        "blocked_dates": blocked_dates,
    }


@router.post("/{listing_id}/block")
def block_dates(
    listing_id: int,
    body: BlockDatesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")

    added = 0
    for date_str in body.dates:
        existing = (
            db.query(AvailabilityBlock)
            .filter(
                AvailabilityBlock.listing_id == listing_id,
                AvailabilityBlock.block_date == date_str,
            )
            .first()
        )
        if not existing:
            block = AvailabilityBlock(
                listing_id=listing_id,
                block_date=date_str,
                reason=body.reason,
                is_manual=True,
            )
            db.add(block)
            added += 1

    db.commit()
    return {"ok": True, "added": added}


@router.post("/{listing_id}/unblock")
def unblock_dates(
    listing_id: int,
    body: UnblockDatesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")

    for date_str in body.dates:
        db.query(AvailabilityBlock).filter(
            AvailabilityBlock.listing_id == listing_id,
            AvailabilityBlock.block_date == date_str,
            AvailabilityBlock.is_manual.is_(True),
        ).delete(synchronize_session=False)

    db.commit()
    return {"ok": True}
