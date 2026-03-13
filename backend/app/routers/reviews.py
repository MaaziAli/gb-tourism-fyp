from typing import List
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.booking import Booking
from ..models.listing import Listing
from ..models.review import Review
from ..models.user import User
from ..schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def to_response(review: Review, db: Session) -> dict:
    reviewer = db.query(User).filter(
        User.id == review.user_id
    ).first()
    return {
        "id": review.id,
        "listing_id": review.listing_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "reviewer_name": reviewer.full_name if reviewer else "Unknown",
    }


@router.post("/listing/{listing_id}", response_model=ReviewResponse)
def create_review(
    listing_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(400, "You cannot review your own listing")

    booking = db.query(Booking).filter(
        Booking.listing_id == listing_id,
        Booking.user_id == current_user.id,
        Booking.status != "cancelled",
    ).first()

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
    existing = db.query(Review).filter(
        Review.listing_id == listing_id,
        Review.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(
            400,
            "You have already reviewed this listing",
        )
    review = Review(
        listing_id=listing_id,
        user_id=current_user.id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return to_response(review, db)


@router.get("/listing/{listing_id}", response_model=List[ReviewResponse])
def get_reviews(listing_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.listing_id == listing_id
    ).order_by(Review.created_at.desc()).all()
    return [to_response(r, db) for r in reviews]


@router.delete("/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(
        Review.id == review_id
    ).first()
    if not review:
        raise HTTPException(404, "Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(403, "Not your review")
    db.delete(review)
    db.commit()


@router.get("/listing/{listing_id}/summary")
def get_summary(listing_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.listing_id == listing_id
    ).all()
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

