"""
Hotels router — full CRUD for hotel listings (service_type='hotel').

All hotel endpoints operate on the shared Listing model with
service_type='hotel', plus the RoomType child rows.
This router provides Hotel-specific naming and validation on top of
the generic listings infrastructure.
"""
import json
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.review import Review
from app.models.room_type import RoomType
from app.models.user import User

router = APIRouter(prefix="/hotels", tags=["Hotels"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ── helpers ──────────────────────────────────────────────────────────────────

def _save_image(image: UploadFile | None) -> str | None:
    if image is None:
        return None
    suffix = Path(image.filename).suffix
    filename = f"{uuid4().hex}{suffix}"
    with (UPLOAD_DIR / filename).open("wb") as f:
        shutil.copyfileobj(image.file, f)
    return filename


def _parse_amenities(val: str | None) -> list[str]:
    if not val:
        return []
    try:
        parsed = json.loads(val)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _hotel_dict(listing: Listing, db: Session) -> dict:
    """Build the full hotel JSON payload."""
    reviews = db.query(Review).filter(Review.listing_id == listing.id).all()
    review_count = len(reviews)
    avg_rating = (
        round(sum(r.rating for r in reviews) / review_count, 1)
        if review_count else 0.0
    )
    room_types = (
        db.query(RoomType)
        .filter(RoomType.listing_id == listing.id)
        .all()
    )
    owner = db.query(User).filter(User.id == listing.owner_id).first()

    from app.models.listing_image import ListingImage
    extra_images = (
        db.query(ListingImage)
        .filter(ListingImage.listing_id == listing.id)
        .order_by(ListingImage.sort_order)
        .all()
    )

    return {
        "id": listing.id,
        "owner_id": listing.owner_id,
        "owner_name": owner.full_name if owner else "Provider",
        "name": listing.title,
        "description": listing.description,
        "location": listing.location,
        "address": listing.location,
        "rating": avg_rating,
        "review_count": review_count,
        "price_from": min(
            (r.price_per_night for r in room_types), default=listing.price
        ),
        "image_url": listing.image_url,
        "images": [img.image_url for img in extra_images],
        "amenities": _parse_amenities(listing.amenities),
        "is_featured": bool(listing.is_featured),
        "rooms_available": listing.rooms_available,
        "cancellation_policy": listing.cancellation_policy,
        "created_at": None,
        "rooms": [
            {
                "id": r.id,
                "hotel_id": listing.id,
                "room_type": r.name,
                "price_per_night": r.price_per_night,
                "capacity": r.capacity,
                "total_rooms": r.total_rooms or 1,
                "available_rooms": r.available_count,
                "amenities": _parse_amenities(r.amenities),
                "image_url": r.image_url,
                "bed_type": r.bed_type,
                "description": r.description,
            }
            for r in room_types
        ],
        "reviews": [
            {
                "id": rev.id,
                "user_id": rev.user_id,
                "user_name": (
                    rev.user.full_name
                    if getattr(rev, "user", None)
                    else "Guest"
                ),
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": (
                    rev.created_at.isoformat() if rev.created_at else None
                ),
            }
            for rev in reviews
        ],
    }


# ── GET all hotels ────────────────────────────────────────────────────────────

@router.get("/")
def list_hotels(
    location: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    room_type: str | None = None,
    q: str | None = None,
    sort_by: str = "relevance",
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Browse / search hotels with optional filters.
    Returns lightweight card data; use GET /hotels/{id} for full detail.
    """
    query = db.query(Listing).filter(Listing.service_type == "hotel")

    if q and q.strip():
        q_lower = q.strip().lower()
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Listing.title.ilike(f"%{q_lower}%"),
                Listing.location.ilike(f"%{q_lower}%"),
                Listing.description.ilike(f"%{q_lower}%"),
            )
        )

    if location:
        query = query.filter(Listing.location.ilike(f"%{location}%"))

    if min_price is not None:
        query = query.filter(Listing.price >= min_price)

    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    hotels = query.all()

    result = []
    for hotel in hotels:
        reviews = db.query(Review).filter(Review.listing_id == hotel.id).all()
        avg_rating = (
            round(sum(r.rating for r in reviews) / len(reviews), 1)
            if reviews else 0.0
        )

        if min_rating and avg_rating < min_rating:
            continue

        # Filter by room type name if requested
        if room_type:
            has_room = (
                db.query(RoomType)
                .filter(
                    RoomType.listing_id == hotel.id,
                    RoomType.name.ilike(f"%{room_type}%"),
                )
                .first()
            )
            if not has_room:
                continue

        room_types = (
            db.query(RoomType).filter(RoomType.listing_id == hotel.id).all()
        )
        price_from = min(
            (r.price_per_night for r in room_types), default=hotel.price or 0
        )

        result.append({
            "id": hotel.id,
            "name": hotel.title,
            "description": (hotel.description or "")[:150],
            "location": hotel.location,
            "address": hotel.location,
            "rating": avg_rating,
            "review_count": len(reviews),
            "price_from": price_from,
            "image_url": hotel.image_url,
            "amenities": _parse_amenities(hotel.amenities),
            "is_featured": bool(hotel.is_featured),
            "rooms_available": hotel.rooms_available,
            "owner_id": hotel.owner_id,
        })

    if sort_by == "price_low":
        result.sort(key=lambda x: x["price_from"] or 0)
    elif sort_by == "price_high":
        result.sort(key=lambda x: x["price_from"] or 0, reverse=True)
    elif sort_by == "rating":
        result.sort(key=lambda x: x["rating"], reverse=True)
    elif sort_by == "newest":
        result.sort(key=lambda x: x["id"], reverse=True)

    return result[:limit]


# ── GET single hotel ──────────────────────────────────────────────────────────

@router.get("/{hotel_id}")
def get_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """Full hotel detail including rooms, reviews, and images."""
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return _hotel_dict(hotel, db)


# ── CREATE hotel ──────────────────────────────────────────────────────────────

@router.post("/")
def create_hotel(
    name: str = Form(...),
    location: str = Form(...),
    description: str | None = Form(None),
    amenities: str | None = Form(None),
    price: float = Form(..., description="Base price / starting price"),
    cancellation_policy: str = Form("moderate"),
    rooms_available: int = Form(10),
    image: UploadFile | None = File(None),
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hotel listing. Provider only."""
    if current_user.role not in ("provider", "admin"):
        raise HTTPException(status_code=403, detail="Only providers can create hotels")

    image_filename = _save_image(image)
    hotel = Listing(
        owner_id=current_user.id,
        title=name,
        location=location,
        price=price,
        service_type="hotel",
        description=description,
        amenities=amenities,
        image_url=image_filename,
        cancellation_policy=cancellation_policy or "moderate",
        rooms_available=rooms_available,
    )
    db.add(hotel)
    db.commit()
    db.refresh(hotel)

    from app.utils.notify import notify_admin_new_listing
    notify_admin_new_listing(
        db=db,
        listing_title=hotel.title,
        service_type="hotel",
        location=hotel.location,
        price=hotel.price or 0,
        provider_name=current_user.full_name or current_user.email,
        provider_email=current_user.email,
        background_tasks=background_tasks,
    )

    return _hotel_dict(hotel, db)


# ── UPDATE hotel ──────────────────────────────────────────────────────────────

@router.put("/{hotel_id}")
def update_hotel(
    hotel_id: int,
    name: str = Form(...),
    location: str = Form(...),
    description: str | None = Form(None),
    amenities: str | None = Form(None),
    price: float = Form(...),
    cancellation_policy: str | None = Form(None),
    rooms_available: int | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your hotel")

    hotel.title = name
    hotel.location = location
    hotel.price = price
    if description is not None:
        hotel.description = description
    if amenities is not None:
        hotel.amenities = amenities
    if cancellation_policy is not None:
        hotel.cancellation_policy = cancellation_policy
    if rooms_available is not None:
        hotel.rooms_available = rooms_available

    if image is not None:
        old_img = hotel.image_url
        new_filename = _save_image(image)
        if new_filename:
            hotel.image_url = new_filename
            if old_img:
                old_path = UPLOAD_DIR / old_img
                if old_path.exists():
                    old_path.unlink()

    db.commit()
    db.refresh(hotel)
    return _hotel_dict(hotel, db)


# ── DELETE hotel ──────────────────────────────────────────────────────────────

@router.delete("/{hotel_id}", status_code=204)
def delete_hotel(
    hotel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your hotel")

    active = (
        db.query(Booking)
        .filter(
            Booking.listing_id == hotel_id,
            Booking.status.in_(["active", "confirmed"]),
        )
        .first()
    )
    if active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete hotel with active bookings",
        )
    db.delete(hotel)
    db.commit()
    return None


# ── GET bookings for a hotel ──────────────────────────────────────────────────

@router.get("/{hotel_id}/bookings")
def get_hotel_bookings(
    hotel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provider can view all bookings for their hotel."""
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your hotel")

    bookings = (
        db.query(Booking)
        .filter(Booking.listing_id == hotel_id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    result = []
    for b in bookings:
        guest = db.query(User).filter(User.id == b.user_id).first()
        room = None
        if b.room_type_id:
            room = db.query(RoomType).filter(RoomType.id == b.room_type_id).first()
        nights = (
            max(1, (b.check_out - b.check_in).days)
            if b.check_in and b.check_out else 1
        )
        result.append({
            "id": b.id,
            "guest_name": guest.full_name if guest else "Unknown",
            "guest_email": guest.email if guest else "",
            "room_type": room.name if room else b.room_type_name,
            "check_in": b.check_in.isoformat() if b.check_in else None,
            "check_out": b.check_out.isoformat() if b.check_out else None,
            "nights": nights,
            "total_price": b.total_price,
            "status": b.status,
            "payment_status": getattr(b, "payment_status", "unpaid"),
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return result
