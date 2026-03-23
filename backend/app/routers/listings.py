"""
Listings router - full CRUD operations for tourism listings.
"""
from pathlib import Path
from uuid import uuid4
import shutil
import json

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import ListingResponse, ListingUpdate


router = APIRouter(prefix="/listings", tags=["Listings"])

# Save listing images under backend/uploads/
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _save_image(image: UploadFile | None) -> str | None:
    """
    Persist an uploaded image to backend/uploads/ and return the filename.
    """
    if image is None:
        return None
    suffix = Path(image.filename).suffix
    filename = f"{uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return filename


def _parse_amenities(amenities_value: str | None) -> list[str]:
    if not amenities_value:
        return []
    try:
        parsed = json.loads(amenities_value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


@router.post("/", response_model=ListingResponse)
def create_listing(
    title: str = Form(...),
    location: str = Form(...),
    price_per_night: float = Form(...),
    service_type: str = Form(...),
    description: str | None = Form(None),
    amenities: str | None = Form(None),
    cancellation_policy: str = Form("moderate"),
    cancellation_hours_free: int = Form(48),
    rooms_available: int = Form(10),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new listing."""
    if current_user.role != "provider":
        raise HTTPException(
            status_code=403,
            detail="Only providers can create listings",
        )
    image_filename = _save_image(image)
    listing = Listing(
        owner_id=current_user.id,
        title=title,
        location=location,
        price=price_per_night,
        service_type=service_type,
        image_url=image_filename,
        description=description,
        amenities=amenities or None,
        cancellation_policy=cancellation_policy or "moderate",
        cancellation_hours_free=cancellation_hours_free or 48,
        rooms_available=rooms_available if rooms_available is not None else 10,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/")
def get_listings(db: Session = Depends(get_db)):
    """Get all listings with average_rating and review_count."""
    from app.models.review import Review

    listings = db.query(Listing).all()
    result = []
    for listing in listings:
        reviews = (
            db.query(Review).filter(Review.listing_id == listing.id).all()
        )
        review_count = len(reviews)
        avg_rating = 0.0
        if review_count > 0:
            avg_rating = sum(r.rating for r in reviews) / review_count
        result.append({
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "location": listing.location,
            "price_per_night": listing.price_per_night,
            "service_type": listing.service_type,
            "image_url": listing.image_url,
            "owner_id": listing.owner_id,
            "amenities_list": _parse_amenities(
                getattr(listing, "amenities", None)
            ),
            "average_rating": round(avg_rating, 1),
            "review_count": review_count,
            "is_featured": bool(
                getattr(listing, "is_featured", False)
            ),
        })
    return result


@router.get("/featured")
def get_featured_listings_public(db: Session = Depends(get_db)):
    """Public endpoint for featured listings."""
    from app.models.review import Review

    listings = (
        db.query(Listing)
        .filter(Listing.is_featured.is_(True))
        .limit(8)
        .all()
    )

    result = []
    for listing in listings:
        stats = (
            db.query(
                func.avg(Review.rating).label("avg"),
                func.count(Review.id).label("count"),
            )
            .filter(Review.listing_id == listing.id)
            .first()
        )

        result.append(
            {
                "id": listing.id,
                "title": listing.title,
                "location": listing.location,
                "service_type": listing.service_type,
                "price_per_night": listing.price_per_night,
                "image_url": listing.image_url,
                "is_featured": True,
                "average_rating": round(float(stats.avg or 0), 1),
                "review_count": stats.count or 0,
            }
        )
    return result


@router.get("/me")
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all listings owned by the current user with rating data."""
    from app.models.review import Review

    listings = (
        db.query(Listing).filter(Listing.owner_id == current_user.id).all()
    )
    result = []
    for listing in listings:
        reviews = (
            db.query(Review).filter(Review.listing_id == listing.id).all()
        )
        review_count = len(reviews)
        avg_rating = 0.0
        if review_count > 0:
            avg_rating = sum(r.rating for r in reviews) / review_count
        result.append({
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "location": listing.location,
            "price_per_night": listing.price_per_night,
            "service_type": listing.service_type,
            "image_url": listing.image_url,
            "owner_id": listing.owner_id,
            "average_rating": round(avg_rating, 1),
            "review_count": review_count,
            "is_featured": bool(
                getattr(listing, "is_featured", False)
            ),
        })
    return result


@router.get("/debug-upload-dir")
def debug_upload_dir():
    import os

    files: list[str] = []
    exists = UPLOAD_DIR.exists()
    if exists:
        files = os.listdir(UPLOAD_DIR)
    return {
        "upload_dir": str(UPLOAD_DIR),
        "upload_dir_absolute": str(UPLOAD_DIR.resolve()),
        "exists": exists,
        "files_count": len(files),
        "files": files[:10],
    }


@router.get("/check-images")
def check_listing_images(db: Session = Depends(get_db)):
    """
    Utility endpoint to report which listings have missing image files.

    This is intended for development-time cleanup only.
    """
    listings = db.query(Listing).all()
    total = len(listings)
    with_image = 0
    files_found = 0
    files_missing = 0
    missing: list[dict] = []
    found: list[dict] = []

    for listing in listings:
        if not listing.image_url:
            continue
        with_image += 1
        image_path = UPLOAD_DIR / listing.image_url
        info = {
            "id": listing.id,
            "title": listing.title,
            "image_url": listing.image_url,
        }
        if image_path.exists():
            files_found += 1
            found.append(info)
        else:
            files_missing += 1
            missing.append(info)

    return {
        "total_listings": total,
        "listings_with_image_url": with_image,
        "files_found": files_found,
        "files_missing": files_missing,
        "missing": missing,
        "found": found,
    }


@router.post("/clear-missing-images")
def clear_missing_listing_images(db: Session = Depends(get_db)):
    """
    Utility endpoint to clear image_url for listings whose files are missing.

    One-time cleanup helper for development:
    1. Call /listings/check-images to inspect.
    2. Call this endpoint to set image_url=None for broken entries.
    3. Re-upload images via the Edit Listing page.
    """
    listings = db.query(Listing).all()
    cleared_ids: list[int] = []

    for listing in listings:
        if not listing.image_url:
            continue
        image_path = UPLOAD_DIR / listing.image_url
        if not image_path.exists():
            listing.image_url = None
            cleared_ids.append(listing.id)

    if cleared_ids:
        db.commit()

    return {"cleared": len(cleared_ids), "listing_ids_cleared": cleared_ids}


@router.get("/search")
def smart_search(
    q: str = "",
    service_type: str | None = None,
    location: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    sort_by: str = "relevance",
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Smart search with filters and scoring."""
    from sqlalchemy import and_, func, or_

    from app.models.review import Review

    query = db.query(Listing)

    if q and q.strip():
        q_lower = q.strip().lower()
        search_terms = q_lower.split()

        conditions = []
        for term in search_terms:
            conditions.append(
                or_(
                    Listing.title.ilike(f"%{term}%"),
                    Listing.location.ilike(f"%{term}%"),
                    Listing.description.ilike(f"%{term}%"),
                    Listing.service_type.ilike(f"%{term}%"),
                )
            )
        if conditions:
            query = query.filter(and_(*conditions))

    if service_type:
        types = [t.strip() for t in service_type.split(",") if t.strip()]
        if types:
            query = query.filter(Listing.service_type.in_(types))

    if location:
        query = query.filter(Listing.location.ilike(f"%{location}%"))

    if min_price is not None:
        query = query.filter(Listing.price >= min_price)

    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    listings = query.all()

    results = []
    for listing in listings:
        review_stats = (
            db.query(
                func.avg(Review.rating).label("avg"),
                func.count(Review.id).label("count"),
            )
            .filter(Review.listing_id == listing.id)
            .first()
        )

        avg_rating = round(float(review_stats.avg or 0), 1)
        review_count = review_stats.count or 0

        if min_rating is not None and min_rating > 0 and avg_rating < min_rating:
            continue

        score = 0
        if q and q.strip():
            q_lower = q.strip().lower()
            title_l = (listing.title or "").lower()
            loc_l = (listing.location or "").lower()
            desc_l = (listing.description or "").lower()
            if q_lower in title_l:
                score += 10
            if q_lower in loc_l:
                score += 5
            if q_lower in desc_l:
                score += 3

        score += avg_rating * 2
        score += min(review_count * 0.1, 5)

        desc = listing.description or ""
        results.append(
            {
                "id": listing.id,
                "title": listing.title,
                "location": listing.location,
                "description": desc[:120] + ("..." if len(desc) > 120 else ""),
                "service_type": listing.service_type,
                "price_per_night": listing.price_per_night,
                "image_url": listing.image_url,
                "average_rating": avg_rating,
                "review_count": review_count,
                "relevance_score": score,
                "is_featured": bool(
                    getattr(listing, "is_featured", False)
                ),
            }
        )

    if sort_by == "relevance":
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
    elif sort_by == "price_low":
        results.sort(key=lambda x: x["price_per_night"] or 0)
    elif sort_by == "price_high":
        results.sort(key=lambda x: x["price_per_night"] or 0, reverse=True)
    elif sort_by == "rating":
        results.sort(key=lambda x: x["average_rating"], reverse=True)
    elif sort_by == "newest":
        results.sort(key=lambda x: x["id"], reverse=True)

    return {
        "query": q,
        "total": len(results),
        "results": results[:limit],
        "filters_applied": {
            "service_type": service_type,
            "location": location,
            "min_price": min_price,
            "max_price": max_price,
            "min_rating": min_rating,
            "sort_by": sort_by,
        },
    }


@router.get("/search/suggestions")
def search_suggestions(
    q: str = "",
    db: Session = Depends(get_db),
):
    """Return search suggestions as user types."""
    if not q or len(q.strip()) < 2:
        return {"suggestions": []}

    q_lower = q.strip().lower()

    titles = (
        db.query(Listing.title, Listing.service_type)
        .filter(Listing.title.ilike(f"%{q_lower}%"))
        .limit(4)
        .all()
    )

    locations = (
        db.query(Listing.location)
        .filter(Listing.location.isnot(None), Listing.location.ilike(f"%{q_lower}%"))
        .distinct()
        .limit(4)
        .all()
    )

    suggestions = []

    for t in titles:
        suggestions.append(
            {
                "type": "service",
                "text": t.title,
                "service_type": t.service_type,
                "icon": "🏨",
            }
        )

    for l in locations:
        loc = l.location
        if loc and not any(s["text"] == loc for s in suggestions):
            suggestions.append({"type": "location", "text": loc, "icon": "📍"})

    gb_places = [
        "Hunza",
        "Skardu",
        "Gilgit",
        "Nagar",
        "Ghizer",
        "Naltar",
        "Fairy Meadows",
        "Deosai",
    ]
    for place in gb_places:
        if q_lower in place.lower() and not any(s["text"] == place for s in suggestions):
            suggestions.append({"type": "destination", "text": place, "icon": "🗺️"})

    return {"suggestions": suggestions[:8]}


@router.get("/compare")
def compare_listings(
    ids: str,
    db: Session = Depends(get_db),
):
    """Compare multiple listings side by side.

    ids = comma-separated listing IDs, e.g. ?ids=1,2,3
    """
    from app.models.review import Review
    from app.models.room_type import RoomType

    id_list: list[int] = []
    for id_str in ids.split(","):
        try:
            id_list.append(int(id_str.strip()))
        except ValueError:
            pass

    if not id_list:
        raise HTTPException(
            status_code=400,
            detail="No valid IDs provided",
        )

    if len(id_list) > 3:
        raise HTTPException(
            status_code=400,
            detail="Maximum 3 listings to compare",
        )

    listings = db.query(Listing).filter(Listing.id.in_(id_list)).all()
    id_order = {lid: idx for idx, lid in enumerate(id_list)}
    listings = sorted(listings, key=lambda x: id_order.get(x.id, 999))

    results = []
    for listing in listings:
        stats = (
            db.query(
                func.avg(Review.rating).label("avg"),
                func.count(Review.id).label("count"),
            )
            .filter(Review.listing_id == listing.id)
            .first()
        )

        avg_rating = round(float(stats.avg or 0), 1)
        review_count = stats.count or 0

        distribution: dict[str, int] = {}
        for star in range(1, 6):
            c = (
                db.query(Review)
                .filter(
                    Review.listing_id == listing.id,
                    Review.rating == star,
                )
                .count()
            )
            distribution[str(star)] = c

        total_bookings = (
            db.query(Booking)
            .filter(
                Booking.listing_id == listing.id,
                Booking.status != "cancelled",
            )
            .count()
        )

        room_types: list[dict] = []
        if listing.service_type == "hotel":
            rooms = (
                db.query(RoomType)
                .filter(RoomType.listing_id == listing.id)
                .all()
            )
            room_types = [
                {
                    "name": r.name,
                    "price": r.price_per_night,
                    "capacity": r.capacity,
                }
                for r in rooms
            ]

        recent_reviews = (
            db.query(Review)
            .filter(Review.listing_id == listing.id)
            .order_by(Review.created_at.desc())
            .limit(3)
            .all()
        )

        reviews_data = []
        for r in recent_reviews:
            reviewer = (
                db.query(User).filter(User.id == r.user_id).first()
            )
            reviews_data.append(
                {
                    "rating": r.rating,
                    "comment": r.comment,
                    "reviewer_name": reviewer.full_name
                    if reviewer
                    else "Guest",
                }
            )

        price_labels = {
            "hotel": "/night",
            "tour": "/person",
            "activity": "/person",
            "horse_riding": "/person",
            "guide": "/day",
            "boat_trip": "/person",
            "car_rental": "/day",
            "bike_rental": "/day",
            "jeep_safari": "/day",
            "camping": "/night",
            "restaurant": "/person",
            "transport": "/trip",
            "medical": "/visit",
        }
        price_label = price_labels.get(listing.service_type, "/night")

        results.append(
            {
                "id": listing.id,
                "title": listing.title,
                "description": listing.description,
                "location": listing.location,
                "service_type": listing.service_type,
                "price_per_night": listing.price_per_night,
                "price_label": price_label,
                "image_url": listing.image_url,
                "is_featured": bool(
                    getattr(listing, "is_featured", False)
                ),
                "average_rating": avg_rating,
                "review_count": review_count,
                "total_bookings": total_bookings,
                "rating_distribution": distribution,
                "room_types": room_types,
                "recent_reviews": reviews_data,
                "highlights": {
                    "best_value": False,
                    "most_popular": False,
                    "top_rated": False,
                },
            }
        )

    if results:
        if len(results) > 1:
            prices = [
                (r["price_per_night"] or 0, i)
                for i, r in enumerate(results)
            ]
            prices.sort()
            if prices[0][0] > 0:
                results[prices[0][1]]["highlights"]["best_value"] = True

        max_bookings = max(r["total_bookings"] for r in results)
        if max_bookings > 0:
            for r in results:
                if r["total_bookings"] == max_bookings:
                    r["highlights"]["most_popular"] = True
                    break

        max_rating = max(r["average_rating"] for r in results)
        if max_rating > 0:
            for r in results:
                if r["average_rating"] == max_rating:
                    r["highlights"]["top_rated"] = True
                    break

    return {
        "count": len(results),
        "listings": results,
    }


@router.get("/{listing_id}")
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    """Get a single listing by ID with average_rating and review_count."""
    from app.models.review import Review

    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    reviews = db.query(Review).filter(Review.listing_id == listing_id).all()
    review_count = len(reviews)
    avg_rating = 0.0
    if review_count > 0:
        avg_rating = sum(r.rating for r in reviews) / review_count

    owner = db.query(User).filter(User.id == listing.owner_id).first()

    cancel_policy = getattr(listing, "cancellation_policy", None) or "moderate"
    cancel_hours = getattr(listing, "cancellation_hours_free", None) or 48
    rooms_left = getattr(listing, "rooms_available", None)
    if rooms_left is None:
        rooms_left = 10

    policy_map = {
        "flexible": {
            "label": "Flexible",
            "emoji": "✅",
            "color": "#16a34a",
            "bg": "#dcfce7",
            "border": "#86efac",
            "rules": [
                "Full refund if cancelled 48h+ before",
                "50% refund if cancelled within 48h",
                "No refund for no-shows",
            ],
        },
        "moderate": {
            "label": "Moderate",
            "emoji": "⚠️",
            "color": "#d97706",
            "bg": "#fef3c7",
            "border": "#fcd34d",
            "rules": [
                "Full refund if cancelled 5+ days before",
                "No refund within 5 days of check-in",
                "No refund for no-shows",
            ],
        },
        "strict": {
            "label": "Strict",
            "emoji": "❌",
            "color": "#dc2626",
            "bg": "#fee2e2",
            "border": "#fca5a5",
            "rules": [
                "50% refund if cancelled 1 week before",
                "No refund within 1 week",
                "No refund for no-shows",
            ],
        },
    }

    price = listing.price_per_night or 0
    taxes = round(price * 0.10, 2)
    service_fee = round(price * 0.05, 2)

    listing_data = {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "amenities": getattr(listing, "amenities", None),
        "amenities_list": _parse_amenities(
            getattr(listing, "amenities", None)
        ),
        "location": listing.location,
        "price_per_night": listing.price_per_night,
        "service_type": listing.service_type,
        "image_url": listing.image_url,
        "owner_id": listing.owner_id,
        "owner_name": owner.full_name if owner else "Provider",
        "average_rating": round(avg_rating, 1),
        "review_count": review_count,
        "is_featured": bool(
            getattr(listing, "is_featured", False)
        ),
        "cancellation_policy": cancel_policy,
        "cancellation_hours_free": cancel_hours,
        "cancellation_policy_info": policy_map.get(
            cancel_policy,
            {
                "label": "Moderate",
                "emoji": "⚠️",
                "color": "#d97706",
                "bg": "#fef3c7",
                "border": "#fcd34d",
                "rules": [
                    "Full refund if cancelled 5+ days before",
                    "No refund within 5 days of check-in",
                    "No refund for no-shows",
                ],
            },
        ),
        "rooms_available": rooms_left,
        "urgency": (
            f"Only {rooms_left} rooms left!"
            if rooms_left is not None and rooms_left <= 5
            else None
        ),
        "price_breakdown_sample": {
            "base_price": price,
            "taxes": taxes,
            "service_fee": service_fee,
            "total_per_night": round(price + taxes + service_fee, 2),
            "tax_rate": 10,
            "service_fee_rate": 5,
            "note": "Taxes & fees included in final total",
        },
        "reviews": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "user_name": r.user.full_name if getattr(r, "user", None) else "User",
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "cleanliness_rating": getattr(r, "cleanliness_rating", 0) or 0,
                "location_rating": getattr(r, "location_rating", 0) or 0,
                "value_rating": getattr(r, "value_rating", 0) or 0,
                "staff_rating": getattr(r, "staff_rating", 0) or 0,
                "facilities_rating": getattr(r, "facilities_rating", 0) or 0,
                "provider_reply": getattr(r, "provider_reply", None),
                "provider_reply_at": (
                    r.provider_reply_at.isoformat()
                    if getattr(r, "provider_reply_at", None)
                    else None
                ),
            }
            for r in reviews
        ],
    }
    return listing_data


@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    title: str = Form(...),
    location: str = Form(...),
    price_per_night: float = Form(...),
    service_type: str = Form(...),
    description: str | None = Form(None),
    amenities: str | None = Form(None),
    cancellation_policy: str | None = Form(None),
    cancellation_hours_free: int | None = Form(None),
    rooms_available: int | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing listing."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to edit this listing",
        )
    listing.title = title
    listing.location = location
    listing.price = price_per_night
    listing.service_type = service_type
    if description is not None:
        listing.description = description
    if amenities is not None:
        listing.amenities = amenities
    if cancellation_policy is not None:
        listing.cancellation_policy = cancellation_policy
    if cancellation_hours_free is not None:
        listing.cancellation_hours_free = cancellation_hours_free
    if rooms_available is not None:
        listing.rooms_available = rooms_available

    # When a new image is uploaded, replace the old file on disk and update image_url.
    if image is not None:
        old_image = listing.image_url
        image_filename = _save_image(image)
        if image_filename is not None:
            listing.image_url = image_filename
            if old_image:
                old_file = UPLOAD_DIR / old_image
                if old_file.exists():
                    old_file.unlink()
    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a listing."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this listing",
        )
    # Prevent deleting listings that still have bookings
    has_booking = (
        db.query(Booking)
        .filter(Booking.listing_id == listing_id, Booking.status == "active")
        .first()
    )
    if has_booking:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete listing with existing bookings. Please cancel bookings first.",
        )
    db.delete(listing)
    db.commit()
    return None
