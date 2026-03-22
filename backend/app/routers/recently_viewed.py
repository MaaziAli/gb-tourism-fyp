from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user

router = APIRouter(
    prefix="/recently-viewed",
    tags=["Recently Viewed"]
)


@router.get("/")
def get_recently_viewed(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        from ..models.recently_viewed import (
            RecentlyViewed
        )
        from ..models.listing import Listing
        from ..models.review import Review

        rows = db.query(RecentlyViewed).filter(
            RecentlyViewed.user_id ==
                current_user.id
        ).order_by(
            RecentlyViewed.viewed_at.desc()
        ).limit(8).all()

        result = []
        for row in rows:
            listing = db.query(Listing).filter(
                Listing.id == row.listing_id
            ).first()
            if not listing:
                continue

            stats = db.query(
                func.avg(Review.rating)
                    .label("avg"),
                func.count(Review.id)
                    .label("cnt")
            ).filter(
                Review.listing_id == listing.id
            ).first()

            result.append({
                "id": listing.id,
                "title": listing.title,
                "location": listing.location,
                "service_type":
                    listing.service_type,
                "price_per_night":
                    listing.price_per_night,
                "image_url": listing.image_url,
                "average_rating": round(
                    float(stats.avg or 0), 1
                ),
                "viewed_at":
                    row.viewed_at.isoformat()
            })
        return result
    except Exception as e:
        print(f"Recently viewed error: {e}")
        return []


@router.post("/{listing_id}")
def mark_viewed(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        from ..models.recently_viewed import (
            RecentlyViewed
        )

        existing = db.query(
            RecentlyViewed
        ).filter(
            RecentlyViewed.user_id ==
                current_user.id,
            RecentlyViewed.listing_id ==
                listing_id
        ).first()

        if existing:
            existing.viewed_at = datetime.utcnow()
        else:
            count = db.query(
                RecentlyViewed
            ).filter(
                RecentlyViewed.user_id ==
                    current_user.id
            ).count()

            if count >= 20:
                oldest = db.query(
                    RecentlyViewed
                ).filter(
                    RecentlyViewed.user_id ==
                        current_user.id
                ).order_by(
                    RecentlyViewed.viewed_at.asc()
                ).first()
                if oldest:
                    db.delete(oldest)

            rv = RecentlyViewed(
                user_id=current_user.id,
                listing_id=listing_id
            )
            db.add(rv)

        db.commit()
        return {"ok": True}
    except Exception as e:
        print(f"Mark viewed error: {e}")
        return {"ok": False}
