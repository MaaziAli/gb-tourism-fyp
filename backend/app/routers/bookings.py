"""
Bookings router - create, list, and cancel bookings.
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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
    body: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new booking."""
    listing = db.query(Listing).filter(Listing.id == body.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Providers cannot book their own listings
    if listing.owner_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Providers cannot book their own listings",
        )

    today = date_type.today()
    if body.check_in < today:
        raise HTTPException(
            status_code=400,
            detail="Check-in date cannot be in the past",
        )
    if body.check_out <= body.check_in:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    # Prevent overlapping active bookings for the same listing
    overlapping = (
        db.query(Booking)
        .filter(
            Booking.listing_id == body.listing_id,
            Booking.status == "active",
            Booking.check_in < body.check_out,
            Booking.check_out > body.check_in,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(
            status_code=400,
            detail="Booking conflict: dates overlap with existing booking",
        )

    nights = (body.check_out - body.check_in).days
    total_price = nights * listing.price_per_night

    booking = Booking(
        listing_id=body.listing_id,
        user_id=current_user.id,
        check_in=body.check_in,
        check_out=body.check_out,
        total_price=total_price,
        status="active",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/listing/{listing_id}/bookings", response_model=list[BookingResponse])
def get_listing_bookings(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bookings for a specific listing owned by the current provider."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    return db.query(Booking).filter(Booking.listing_id == listing_id).all()


@router.get("/provider/revenue")
def get_provider_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get total revenue for bookings on the current provider's listings."""
    if current_user.role != "provider":
        raise HTTPException(status_code=403, detail="Only providers can access this")
    total = (
        db.query(func.count(Booking.id))
        .join(Listing, Booking.listing_id == Listing.id)
        .filter(Listing.owner_id == current_user.id, Booking.status == "active")
        .scalar()
        or 0
    )
    return {"total_bookings": total}


@router.get("/me", response_model=list[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bookings for the current user."""
    return db.query(Booking).filter(Booking.user_id == current_user.id).all()


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an active booking for the current user.
    Any active booking can be cancelled; no date restrictions.
    """
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Booking is already cancelled",
        )
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking
