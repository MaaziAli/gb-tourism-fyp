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
from app.models.review import Review
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

    # Optional room type
    room_type = None
    if body.room_type_id:
        from app.models.room_type import RoomType

        room_type = (
            db.query(RoomType)
            .filter(
                RoomType.id == body.room_type_id,
                RoomType.listing_id == body.listing_id,
            )
            .first()
        )
        if not room_type:
            raise HTTPException(status_code=404, detail="Room type not found")

    price_per_night = (
        room_type.price_per_night if room_type else listing.price_per_night
    )
    nights = (body.check_out - body.check_in).days
    total_price = nights * price_per_night

    booking = Booking(
        listing_id=body.listing_id,
        user_id=current_user.id,
        check_in=body.check_in,
        check_out=body.check_out,
        total_price=total_price,
        status="active",
        room_type_id=body.room_type_id if body.room_type_id else None,
        room_type_name=room_type.name if room_type else None,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/listing/{listing_id}/bookings")
def get_listing_bookings(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed bookings for a specific listing owned by the current provider or admin."""
    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your listing")

    bookings = (
        db.query(Booking)
        .filter(Booking.listing_id == listing_id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    from app.models.user import User as Guest

    result: list[dict] = []
    for b in bookings:
        guest = db.query(Guest).filter(Guest.id == b.user_id).first()

        nights = None
        if b.check_in and b.check_out:
            delta = b.check_out - b.check_in
            nights = delta.days

        result.append(
            {
                "id": b.id,
                "guest_name": guest.full_name if guest else "Unknown",
                "guest_email": guest.email if guest else "",
                "check_in": b.check_in.isoformat() if b.check_in else None,
                "check_out": b.check_out.isoformat() if b.check_out else None,
                "nights": nights,
                "total_price": b.total_price,
                "status": b.status or "active",
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
        )

    return result


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


@router.get("/me")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    result = []
    for b in bookings:
        listing = (
            db.query(Listing).filter(Listing.id == b.listing_id).first()
        )
        result.append(
            {
                "id": b.id,
                "listing_id": b.listing_id,
                "listing_title": listing.title if listing else "Unknown",
                "location": listing.location if listing else "",
                "image_url": listing.image_url if listing else None,
                "check_in": b.check_in.isoformat() if b.check_in else None,
                "check_out": b.check_out.isoformat()
                if b.check_out
                else None,
                "total_price": b.total_price,
                "status": b.status or "active",
                "room_type_id": b.room_type_id,
                "room_type_name": b.room_type_name,
                "created_at": b.created_at.isoformat()
                if b.created_at
                else None,
            }
        )
    return result


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


@router.get("/provider/analytics")
def get_provider_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(status_code=403, detail="Providers only")

    # Get all listings owned by this provider
    listings = db.query(Listing).filter(
        Listing.owner_id == current_user.id
    ).all()

    listing_ids = [l.id for l in listings]

    if not listing_ids:
        return {
            "total_listings": 0,
            "total_bookings": 0,
            "active_bookings": 0,
            "cancelled_bookings": 0,
            "total_revenue": 0,
            "avg_revenue_per_listing": 0,
            "total_reviews": 0,
            "average_rating": 0,
            "listings_analytics": [],
        }

    # Get all bookings for those listings
    all_bookings = db.query(Booking).filter(
        Booking.listing_id.in_(listing_ids)
    ).all()

    active_bookings = [b for b in all_bookings if b.status == "active"]
    cancelled_bookings = [b for b in all_bookings if b.status == "cancelled"]
    total_revenue = sum(b.total_price or 0 for b in active_bookings)

    # Get all reviews for those listings
    all_reviews = db.query(Review).filter(
        Review.listing_id.in_(listing_ids)
    ).all()

    avg_rating = (
        round(
            sum(r.rating for r in all_reviews) / len(all_reviews),
            1,
        )
        if all_reviews
        else 0
    )

    # Per-listing breakdown
    listings_analytics = []
    for listing in listings:
        l_bookings = [b for b in all_bookings if b.listing_id == listing.id]
        l_active = [b for b in l_bookings if b.status == "active"]
        l_revenue = sum(b.total_price or 0 for b in l_active)
        l_reviews = [r for r in all_reviews if r.listing_id == listing.id]
        l_avg = (
            round(
                sum(r.rating for r in l_reviews) / len(l_reviews),
                1,
            )
            if l_reviews
            else 0
        )

        listings_analytics.append(
            {
                "id": listing.id,
                "title": listing.title,
                "location": listing.location,
                "service_type": listing.service_type,
                "price_per_night": listing.price_per_night,
                "image_url": listing.image_url,
                "total_bookings": len(l_bookings),
                "active_bookings": len(l_active),
                "total_revenue": l_revenue,
                "total_reviews": len(l_reviews),
                "average_rating": l_avg,
            }
        )

    # Sort by revenue descending
    listings_analytics.sort(key=lambda x: x["total_revenue"], reverse=True)

    return {
        "total_listings": len(listings),
        "total_bookings": len(all_bookings),
        "active_bookings": len(active_bookings),
        "cancelled_bookings": len(cancelled_bookings),
        "total_revenue": total_revenue,
        "avg_revenue_per_listing": (
            round(total_revenue / len(listings), 0) if listings else 0
        ),
        "total_reviews": len(all_reviews),
        "average_rating": avg_rating,
        "listings_analytics": listings_analytics,
    }
