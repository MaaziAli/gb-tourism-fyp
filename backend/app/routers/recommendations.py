"""
Recommendations router - content-based listing recommendations.
"""
from collections import Counter
from typing import List, Optional

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.jwt import ALGORITHM, SECRET_KEY
from app.database import get_db
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User
from app.schemas.recommendation import RecommendationResponse


router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False,
)


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except JWTError:
        return None


def _get_popularity_map(db: Session) -> dict[int, int]:
    """Return a mapping of listing_id -> active bookings count."""
    rows = (
        db.query(Booking.listing_id, func.count(Booking.id))
        .filter(Booking.status == "active")
        .group_by(Booking.listing_id)
        .all()
    )
    return {listing_id: count for listing_id, count in rows}


def _build_recommendation(
    listing: Listing,
    score: float,
    reason: str,
) -> RecommendationResponse:
    return RecommendationResponse(
        id=listing.id,
        title=listing.title,
        location=listing.location,
        price_per_night=listing.price_per_night,
        service_type=listing.service_type,
        image_url=listing.image_url,
        owner_id=listing.owner_id,
        recommendation_reason=reason,
        match_score=score,
    )


@router.get("/", response_model=List[RecommendationResponse])
def get_recommendations(
    limit: int = 6,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get recommended listings.

    - For logged-in users: content-based on their bookings.
    - For guests / new users: most popular listings.
    """
    popularity_map = _get_popularity_map(db)

    # Anonymous or unauthenticated users: return popular listings.
    if current_user is None:
        listings = db.query(Listing).all()
        scored = []
        for listing in listings:
          popularity_count = popularity_map.get(listing.id, 0)
          popularity_score = min(popularity_count / 5.0, 2.0)
          if popularity_score <= 0:
              continue
          scored.append(
              _build_recommendation(
                  listing=listing,
                  score=float(popularity_score),
                  reason="Trending in Gilgit-Baltistan",
              )
          )
        scored.sort(key=lambda r: r.match_score, reverse=True)
        return scored[: max(limit, 0)]

    # Logged-in user: build preference profile from past bookings.
    user_bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .all()
    )

    if not user_bookings:
        # No history -> popular listings
        listings = db.query(Listing).all()
        scored = []
        for listing in listings:
          if listing.owner_id == current_user.id:
              continue
          popularity_count = popularity_map.get(listing.id, 0)
          popularity_score = min(popularity_count / 5.0, 2.0)
          if popularity_score <= 0:
              continue
          scored.append(
              _build_recommendation(
                  listing=listing,
                  score=float(popularity_score),
                  reason="Trending in Gilgit-Baltistan",
              )
          )
        scored.sort(key=lambda r: r.match_score, reverse=True)
        return scored[: max(limit, 0)]

    # Build lists of listings from the user's bookings.
    listing_ids = {b.listing_id for b in user_bookings}
    booked_listings = (
        db.query(Listing)
        .filter(Listing.id.in_(listing_ids))
        .all()
    )

    # Preference profile.
    service_types = [l.service_type for l in booked_listings if l.service_type]
    locations = [l.location for l in booked_listings if l.location]
    prices = [l.price_per_night for l in booked_listings if l.price_per_night]

    service_counter = Counter(service_types)
    location_counter = Counter(locations)

    most_common_service: Optional[str] = None
    if service_counter:
        most_common_service = service_counter.most_common(1)[0][0]

    preferred_services = set(service_counter.keys())
    preferred_locations = set(location_counter.keys())

    avg_price: Optional[float] = None
    if prices:
        avg_price = sum(prices) / len(prices)

    # Listings the user already has active bookings on (to exclude).
    active_booked_listing_ids = {
        b.listing_id
        for b in user_bookings
        if b.status == "active"
    }

    # Score all candidate listings.
    candidates = db.query(Listing).all()
    scored: list[RecommendationResponse] = []

    for listing in candidates:
        # Skip the user's own listings and already actively booked listings.
        if listing.owner_id == current_user.id:
            continue
        if listing.id in active_booked_listing_ids:
            continue

        service_type_score = 0.0
        if most_common_service and listing.service_type == most_common_service:
            service_type_score += 3.0
        elif listing.service_type in preferred_services:
            service_type_score += 1.0

        location_score = 0.0
        if listing.location:
            loc_lower = listing.location.lower()
            for pref_loc in preferred_locations:
                if pref_loc and pref_loc.lower() in loc_lower:
                    location_score = 2.0
                    break

        price_score = 0.0
        if avg_price is not None and listing.price_per_night:
            price = listing.price_per_night
            if avg_price * 0.5 <= price <= avg_price * 1.5:
                price_score = 2.0
            elif avg_price * 0.0 <= price <= avg_price * 2.0:
                price_score = 1.0

        popularity_count = popularity_map.get(listing.id, 0)
        popularity_score = min(popularity_count / 5.0, 2.0)

        total_score = service_type_score + location_score + price_score + popularity_score
        if total_score <= 0:
            # Ignore items that don't match at all.
            continue

        # Build a human-readable reason.
        reasons: list[str] = []
        if service_type_score >= 3:
            reasons.append("Matches your preferred service type")
        elif service_type_score > 0:
            reasons.append("Similar service type to places you've booked")

        if location_score > 0:
            reasons.append("Matches your preferred locations")

        if price_score >= 2:
            reasons.append("Within your usual budget range")
        elif price_score > 0:
            reasons.append("Similar price to your previous stays")

        if popularity_score >= 2:
            reasons.append("Very popular with other travelers")
        elif popularity_score > 0:
            reasons.append("Popular choice among visitors")

        if not reasons:
            reason_text = "Popular choice"
        else:
            reason_text = " · ".join(reasons)

        scored.append(
            _build_recommendation(
                listing=listing,
                score=float(total_score),
                reason=reason_text,
            )
        )

    scored.sort(key=lambda r: r.match_score, reverse=True)
    return scored[: max(limit, 0)]


@router.get("/similar/{listing_id}", response_model=List[RecommendationResponse])
def get_similar_listings(
    listing_id: int,
    limit: int = 4,
    db: Session = Depends(get_db),
):
    """Return listings similar to the given listing."""
    base = db.get(Listing, listing_id)
    if base is None:
        return []

    candidates = (
        db.query(Listing)
        .filter(Listing.id != base.id)
        .all()
    )

    scored: list[RecommendationResponse] = []

    for listing in candidates:
        score = 0.0
        reasons: list[str] = []

        if listing.service_type == base.service_type:
            score += 3.0
            reasons.append("Similar service type")

        if listing.location and base.location:
            loc = listing.location.lower()
            base_loc = base.location.lower()
            if base_loc in loc or loc in base_loc:
                score += 2.0
                reasons.append("Same or nearby location")

        if base.price_per_night and listing.price_per_night:
            price = listing.price_per_night
            base_price = base.price_per_night
            if base_price * 0.5 <= price <= base_price * 1.5:
                score += 2.0
                reasons.append("Similar price range")

        if score <= 0:
            continue

        if not reasons:
            reason_text = "Similar listing"
        else:
            reason_text = " · ".join(reasons)

        scored.append(
            _build_recommendation(
                listing=listing,
                score=float(score),
                reason=reason_text,
            )
        )

    scored.sort(key=lambda r: r.match_score, reverse=True)
    return scored[: max(limit, 0)]

