from datetime import date as date_type
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.booking import Booking
from ..models.listing import Listing
from ..models.review import Review
from ..models.user import User
from ..schemas.review import ProviderReplyBody, ReviewCreate
from ..utils.notify import create_notification

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def to_response(review: Review, db: Session) -> dict:
    reviewer = db.query(User).filter(User.id == review.user_id).first()
    return {
        "id": review.id,
        "listing_id": review.listing_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "reviewer_name": reviewer.full_name if reviewer else "Unknown",
        "cleanliness_rating": float(
            getattr(review, "cleanliness_rating", 0) or 0
        ),
        "location_rating": float(
            getattr(review, "location_rating", 0) or 0
        ),
        "value_rating": float(getattr(review, "value_rating", 0) or 0),
        "staff_rating": float(getattr(review, "staff_rating", 0) or 0),
        "facilities_rating": float(
            getattr(review, "facilities_rating", 0) or 0
        ),
        "provider_reply": getattr(review, "provider_reply", None),
        "provider_reply_at": getattr(review, "provider_reply_at", None),
    }


@router.post("/listing/{listing_id}")
def create_review(
    listing_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(400, "You cannot review your own listing")

    booking = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.user_id == current_user.id,
            Booking.status != "cancelled",
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            400,
            "You must book this listing before reviewing",
        )

    today = date_type.today()
    if booking.check_out is None or booking.check_out >= today:
        raise HTTPException(
            400,
            "You can only review after your check-out date",
        )
    existing = (
        db.query(Review)
        .filter(
            Review.listing_id == listing_id,
            Review.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "You have already reviewed this listing")
    review = Review(
        listing_id=listing_id,
        user_id=current_user.id,
        rating=body.rating,
        comment=body.comment,
        cleanliness_rating=float(body.cleanliness_rating or 0),
        location_rating=float(body.location_rating or 0),
        value_rating=float(body.value_rating or 0),
        staff_rating=float(body.staff_rating or 0),
        facilities_rating=float(body.facilities_rating or 0),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    try:
        from app.utils.loyalty_utils import BONUS_POINTS, add_points

        add_points(
            db,
            user_id=current_user.id,
            points=BONUS_POINTS["review"],
            transaction_type="review_bonus",
            description=(
                f"⭐ Review bonus for rating '{listing.title}'"
            ),
            reference_id=review.id,
        )
        create_notification(
            db,
            user_id=current_user.id,
            title=f"+{BONUS_POINTS['review']} Points for Review!",
            message=(
                f"Thanks for reviewing! You earned "
                f"{BONUS_POINTS['review']} loyalty points."
            ),
            type="success",
        )
    except Exception:
        pass

    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing and listing.owner_id != current_user.id:
        if body.comment and len(body.comment) > 60:
            msg = (
                f"{current_user.full_name} left a {body.rating}-star review on "
                f"'{listing.title}': "
                f"\"{body.comment[:60]}...\""
            )
        elif body.comment:
            msg = (
                f"{current_user.full_name} left a {body.rating}-star review on "
                f"'{listing.title}': \"{body.comment}\""
            )
        else:
            msg = (
                f"{current_user.full_name} left a {body.rating}-star review on "
                f"'{listing.title}'."
            )
        create_notification(
            db,
            user_id=listing.owner_id,
            title="New Review Posted ⭐",
            message=msg,
            type="review",
        )

    return to_response(review, db)


@router.get("/listing/{listing_id}")
def get_reviews(listing_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [to_response(r, db) for r in reviews]


@router.post("/{review_id}/reply")
def add_provider_reply(
    review_id: int,
    body: ProviderReplyBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Not found")

    listing = db.query(Listing).filter(Listing.id == review.listing_id).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your listing")

    review.provider_reply = body.reply
    review.provider_reply_at = datetime.utcnow()
    db.commit()

    try:
        create_notification(
            db,
            user_id=review.user_id,
            title="Provider replied to your review!",
            message=f"{current_user.full_name} replied: {body.reply[:80]}",
            type="review",
        )
    except Exception:
        pass

    return {"ok": True, "reply": body.reply}


@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(403, "Not your review")
    db.delete(review)
    db.commit()


@router.get("/listing/{listing_id}/summary")
def get_summary(listing_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.listing_id == listing_id).all()
    total = len(reviews)
    avg = round(sum(r.rating for r in reviews) / total, 1) if total else 0
    breakdown: dict[str, int] = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for r in reviews:
        breakdown[str(r.rating)] = breakdown.get(str(r.rating), 0) + 1
    return {
        "listing_id": listing_id,
        "average_rating": avg,
        "total_reviews": total,
        "rating_breakdown": breakdown,
    }
