from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.user import User
from app.models.wishlist import Wishlist

router = APIRouter(
    prefix="/wishlist", tags=["Wishlist"]
)


def listing_to_dict(listing):
    return {
        "id": listing.id,
        "title": listing.title,
        "location": listing.location,
        "price_per_night": listing.price_per_night,
        "service_type": listing.service_type,
        "image_url": listing.image_url,
        "average_rating": getattr(
            listing, 'average_rating', 0
        ) or 0,
        "review_count": getattr(
            listing, 'review_count', 0
        ) or 0,
    }


@router.get("/")
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).order_by(Wishlist.created_at.desc()).all()

    result = []
    for item in items:
        listing = db.query(Listing).filter(
            Listing.id == item.listing_id
        ).first()
        if listing:
            d = listing_to_dict(listing)
            d["wishlist_id"] = item.id
            d["saved_at"] = (
                item.created_at.isoformat()
                if item.created_at
                else None
            )
            result.append(d)
    return result


@router.get("/ids")
def get_wishlist_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return just listing IDs in wishlist"""
    items = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).all()
    return [item.listing_id for item in items]


@router.post("/{listing_id}")
def add_to_wishlist(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.listing_id == listing_id
    ).first()
    if existing:
        return {"ok": True, "saved": True,
                "message": "Already in wishlist"}

    item = Wishlist(
        user_id=current_user.id,
        listing_id=listing_id
    )
    db.add(item)
    db.commit()
    return {"ok": True, "saved": True,
            "message": "Added to wishlist"}


@router.delete("/{listing_id}")
def remove_from_wishlist(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.listing_id == listing_id
    ).first()
    if not item:
        raise HTTPException(404, "Not in wishlist")
    db.delete(item)
    db.commit()
    return {"ok": True, "saved": False,
            "message": "Removed from wishlist"}
