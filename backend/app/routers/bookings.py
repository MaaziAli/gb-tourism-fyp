"""
Bookings router - create and list bookings.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=BookingResponse)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new booking."""
    if data.check_in >= data.check_out:
        raise HTTPException(status_code=400, detail="Invalid dates: check_in must be before check_out")

    listing = db.get(Listing, data.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")

    overlapping = (
        db.query(Booking)
        .filter(
            Booking.listing_id == data.listing_id,
            Booking.check_in < data.check_out,
            Booking.check_out > data.check_in,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(status_code=400, detail="Booking conflict: dates overlap with existing booking")

    booking = Booking(
        user_id=current_user.id,
        listing_id=data.listing_id,
        check_in=data.check_in,
        check_out=data.check_out,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/me", response_model=list[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bookings for the current user."""
    return db.query(Booking).filter(Booking.user_id == current_user.id).all()
