from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.recently_viewed import RecentlyViewed
from app.models.review import Review
from app.models.user import User

router = APIRouter(prefix="/recently-viewed", tags=["Recently Viewed"])


@router.post("/{listing_id}")
def mark_viewed(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(RecentlyViewed)
        .filter(
            RecentlyViewed.user_id == current_user.id,
            RecentlyViewed.listing_id == listing_id,
        )
        .first()
    )

    if existing:
        existing.viewed_at = datetime.utcnow()
    else:
        rv = RecentlyViewed(
            user_id=current_user.id,
            listing_id=listing_id,
        )
        db.add(rv)
    db.commit()
    return {"ok": True}


@router.get("/")
def get_recently_viewed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(RecentlyViewed)
        .filter(RecentlyViewed.user_id == current_user.id)
        .order_by(RecentlyViewed.viewed_at.desc())
        .limit(8)
        .all()
    )

    result = []
    for row in rows:
        listing = db.query(Listing).filter(Listing.id == row.listing_id).first()
        if not listing:
            continue

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
                "average_rating": round(float(stats.avg or 0), 1),
                "review_count": stats.count or 0,
                "viewed_at": row.viewed_at.isoformat()
                if row.viewed_at
                else None,
            }
        )
    return result
