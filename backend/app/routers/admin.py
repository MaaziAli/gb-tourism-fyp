"""
Admin router - admin-only management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User


router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats", dependencies=[Depends(require_admin)])
def get_admin_stats(db: Session = Depends(get_db)):
    """Return high-level platform statistics."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_providers = (
        db.query(func.count(User.id)).filter(User.role == "provider").scalar() or 0
    )
    total_travelers = (
        db.query(func.count(User.id)).filter(User.role == "user").scalar() or 0
    )

    total_listings = db.query(func.count(Listing.id)).scalar() or 0

    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    active_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.status == "active")
        .scalar()
        or 0
    )
    cancelled_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.status == "cancelled")
        .scalar()
        or 0
    )

    listings_by_type_rows = (
        db.query(Listing.service_type, func.count(Listing.id))
        .group_by(Listing.service_type)
        .all()
    )
    listings_by_type = {
        service_type: count for service_type, count in listings_by_type_rows
    }

    # Ensure all standard types exist in the response, even if 0.
    for key in ["hotel", "tour", "transport", "activity"]:
        listings_by_type.setdefault(key, 0)

    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "total_travelers": total_travelers,
        "total_listings": total_listings,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "cancelled_bookings": cancelled_bookings,
        "listings_by_type": listings_by_type,
    }


@router.get("/users", dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    """Return all users with basic statistics."""
    users = db.query(User).all()

    # Preload listing and booking counts.
    listing_counts = dict(
        db.query(Listing.owner_id, func.count(Listing.id))
        .group_by(Listing.owner_id)
        .all()
    )
    booking_counts = dict(
        db.query(Booking.user_id, func.count(Booking.id))
        .group_by(Booking.user_id)
        .all()
    )

    result = []
    for user in users:
        result.append(
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "listings_count": listing_counts.get(user.id, 0),
                "bookings_count": booking_counts.get(user.id, 0),
            }
        )
    return result


@router.delete(
    "/users/{user_id}",
    status_code=204,
    dependencies=[Depends(require_admin)],
)
def admin_delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Force delete a user and associated data.

    - Cannot delete the currently authenticated admin.
    - Deletes:
      - All bookings made by the user.
      - All bookings on listings owned by the user.
      - All listings owned by the user.
      - Then deletes the user.
    """
    current_admin = require_admin()

    user = db.get(User, user_id)
    if user is None:
        return

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400, detail="Admins cannot delete their own account"
        )

    # Delete bookings made by the user.
    db.query(Booking).filter(Booking.user_id == user.id).delete()

    # Delete bookings on the user's listings.
    listing_ids = [
        listing.id for listing in db.query(Listing).filter(Listing.owner_id == user.id)
    ]
    if listing_ids:
        db.query(Booking).filter(Booking.listing_id.in_(listing_ids)).delete()

    # Delete listings owned by the user.
    db.query(Listing).filter(Listing.owner_id == user.id).delete()

    # Finally delete the user.
    db.delete(user)
    db.commit()
    return


@router.get("/listings", dependencies=[Depends(require_admin)])
def admin_list_listings(db: Session = Depends(get_db)):
    """Return all listings with owner and booking count information."""
    listings = db.query(Listing).all()

    # owner mapping
    owners = {
        user.id: user
        for user in db.query(User)
        .filter(User.id.in_({l.owner_id for l in listings}))
        .all()
    }

    # booking count per listing
    booking_counts = dict(
        db.query(Booking.listing_id, func.count(Booking.id))
        .group_by(Booking.listing_id)
        .all()
    )

    result = []
    for listing in listings:
        owner = owners.get(listing.owner_id)
        result.append(
            {
                "id": listing.id,
                "owner_id": listing.owner_id,
                "title": listing.title,
                "location": listing.location,
                "price_per_night": listing.price_per_night,
                "service_type": listing.service_type,
                "image_url": listing.image_url,
                "owner_name": owner.full_name if owner else None,
                "owner_email": owner.email if owner else None,
                "bookings_count": booking_counts.get(listing.id, 0),
                "is_featured": bool(
                    getattr(listing, "is_featured", False)
                ),
            }
        )
    return result


@router.delete(
    "/listings/{listing_id}",
    status_code=204,
    dependencies=[Depends(require_admin)],
)
def admin_delete_listing(listing_id: int, db: Session = Depends(get_db)):
    """
    Force delete a listing.

    - Marks all active bookings on this listing as cancelled.
    - Then deletes the listing.
    """
    listing = db.get(Listing, listing_id)
    if listing is None:
        return

    # Cancel active bookings for this listing.
    (
        db.query(Booking)
        .filter(Booking.listing_id == listing.id, Booking.status == "active")
        .update({Booking.status: "cancelled"})
    )

    db.delete(listing)
    db.commit()
    return


@router.patch(
    "/users/{user_id}/role",
    dependencies=[Depends(require_admin)],
)
def admin_update_user_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    """Update a user's role (user, provider, admin)."""
    new_role = payload.get("role")
    if new_role not in {"user", "provider", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


@router.get("/reviews")
def get_all_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    from app.models.review import Review
    from app.models.listing import Listing
    from app.models.user import User as Reviewer

    reviews = db.query(Review).order_by(Review.created_at.desc()).all()

    result: list[dict] = []
    for r in reviews:
        listing = db.query(Listing).filter(Listing.id == r.listing_id).first()
        reviewer = db.query(Reviewer).filter(Reviewer.id == r.user_id).first()
        result.append(
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
                "listing_id": r.listing_id,
                "listing_title": listing.title if listing else "Unknown",
                "reviewer_name": reviewer.full_name if reviewer else "Unknown",
                "reviewer_email": reviewer.email if reviewer else "",
            }
        )

    return result


@router.delete("/reviews/{review_id}", status_code=204)
def admin_delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    from app.models.review import Review

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()
    return


def _month_start(dt) -> "datetime":
    from datetime import datetime

    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _add_months(dt, months: int) -> "datetime":
    from datetime import datetime

    y, m = dt.year, dt.month + months
    while m <= 0:
        m += 12
        y -= 1
    while m > 12:
        m -= 12
        y += 1
    return datetime(y, m, 1)


@router.get("/analytics/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

    from datetime import datetime

    from app.models.event import Event
    from app.models.ticket_booking import TicketBooking

    now = datetime.utcnow()
    first_of_this_month = _month_start(now)

    total_users = db.query(User).count()
    total_providers = (
        db.query(User).filter(User.role == "provider").count()
    )
    total_listings = db.query(Listing).count()
    total_bookings = (
        db.query(Booking).filter(Booking.status != "cancelled").count()
    )
    total_events = db.query(Event).count()

    booking_revenue = (
        db.query(func.sum(Booking.total_price))
        .filter(
            Booking.status != "cancelled",
            Booking.total_price > 0,
        )
        .scalar()
        or 0
    )

    ticket_revenue = (
        db.query(func.sum(TicketBooking.total_price))
        .filter(TicketBooking.status != "cancelled")
        .scalar()
        or 0
    )

    total_revenue = float(booking_revenue or 0) + float(ticket_revenue or 0)
    total_commission = round(total_revenue * 0.10, 2)

    monthly_data = []
    for month_offset in range(11, -1, -1):
        ms = _add_months(first_of_this_month, -month_offset)
        me = _add_months(ms, 1)
        month_label = ms.strftime("%b %Y")
        short_label = ms.strftime("%b")

        m_revenue = (
            db.query(func.sum(Booking.total_price))
            .filter(
                Booking.status != "cancelled",
                Booking.total_price > 0,
                Booking.created_at >= ms,
                Booking.created_at < me,
            )
            .scalar()
            or 0
        )

        t_revenue = (
            db.query(func.sum(TicketBooking.total_price))
            .filter(
                TicketBooking.status != "cancelled",
                TicketBooking.created_at >= ms,
                TicketBooking.created_at < me,
            )
            .scalar()
            or 0
        )

        rev = float(m_revenue or 0) + float(t_revenue or 0)

        new_users = (
            db.query(User)
            .filter(User.created_at >= ms, User.created_at < me)
            .count()
        )

        new_bookings = (
            db.query(Booking)
            .filter(
                Booking.status != "cancelled",
                Booking.created_at >= ms,
                Booking.created_at < me,
            )
            .count()
        )

        monthly_data.append(
            {
                "month": month_label,
                "short": short_label,
                "revenue": round(rev, 2),
                "commission": round(rev * 0.10, 2),
                "bookings": new_bookings,
                "new_users": new_users,
            }
        )

    providers = db.query(User).filter(User.role == "provider").all()
    provider_stats = []
    for p in providers:
        p_listings = (
            db.query(Listing).filter(Listing.owner_id == p.id).all()
        )
        p_listing_ids = [l.id for l in p_listings]
        if not p_listing_ids:
            continue

        p_revenue = (
            db.query(func.sum(Booking.total_price))
            .filter(
                Booking.listing_id.in_(p_listing_ids),
                Booking.status != "cancelled",
            )
            .scalar()
            or 0
        )

        p_bookings = (
            db.query(Booking)
            .filter(
                Booking.listing_id.in_(p_listing_ids),
                Booking.status != "cancelled",
            )
            .count()
        )

        if float(p_revenue or 0) > 0:
            pr = float(p_revenue or 0)
            provider_stats.append(
                {
                    "name": p.full_name,
                    "email": p.email,
                    "listings": len(p_listings),
                    "bookings": p_bookings,
                    "revenue": round(pr, 2),
                    "commission": round(pr * 0.10, 2),
                }
            )

    provider_stats.sort(key=lambda x: x["revenue"], reverse=True)

    all_listings = db.query(Listing).all()
    listing_stats = []
    for lst in all_listings:
        l_revenue = (
            db.query(func.sum(Booking.total_price))
            .filter(
                Booking.listing_id == lst.id,
                Booking.status != "cancelled",
            )
            .scalar()
            or 0
        )

        l_bookings = (
            db.query(Booking)
            .filter(
                Booking.listing_id == lst.id,
                Booking.status != "cancelled",
            )
            .count()
        )

        if l_bookings > 0:
            listing_stats.append(
                {
                    "id": lst.id,
                    "title": lst.title,
                    "location": lst.location,
                    "service_type": lst.service_type,
                    "bookings": l_bookings,
                    "revenue": round(float(l_revenue or 0), 2),
                }
            )

    listing_stats.sort(key=lambda x: x["bookings"], reverse=True)

    service_types = [
        "hotel",
        "tour",
        "transport",
        "activity",
        "restaurant",
        "car_rental",
        "bike_rental",
        "jeep_safari",
        "boat_trip",
        "horse_riding",
        "guide",
        "camping",
        "medical",
    ]
    service_breakdown = []
    for st in service_types:
        count = (
            db.query(Listing).filter(Listing.service_type == st).count()
        )
        if count > 0:
            rev = (
                db.query(func.sum(Booking.total_price))
                .filter(Booking.status != "cancelled")
                .join(Listing, Booking.listing_id == Listing.id)
                .filter(Listing.service_type == st)
                .scalar()
                or 0
            )

            bk = (
                db.query(Booking)
                .join(Listing, Booking.listing_id == Listing.id)
                .filter(
                    Listing.service_type == st,
                    Booking.status != "cancelled",
                )
                .count()
            )

            service_breakdown.append(
                {
                    "type": st,
                    "listings": count,
                    "bookings": bk,
                    "revenue": round(float(rev or 0), 2),
                }
            )

    service_breakdown.sort(key=lambda x: x["revenue"], reverse=True)

    recent_bookings = (
        db.query(Booking)
        .order_by(Booking.created_at.desc())
        .limit(10)
        .all()
    )

    recent_activity = []
    for b in recent_bookings:
        listing = db.query(Listing).filter(Listing.id == b.listing_id).first()
        guest = db.query(User).filter(User.id == b.user_id).first()
        recent_activity.append(
            {
                "type": "booking",
                "user": guest.full_name if guest else "Unknown",
                "service": listing.title if listing else "Unknown",
                "amount": b.total_price,
                "date": b.created_at.isoformat() if b.created_at else None,
            }
        )

    return {
        "totals": {
            "users": total_users,
            "providers": total_providers,
            "listings": total_listings,
            "bookings": total_bookings,
            "events": total_events,
            "revenue": round(total_revenue, 2),
            "commission": total_commission,
            "booking_revenue": round(float(booking_revenue or 0), 2),
            "ticket_revenue": round(float(ticket_revenue or 0), 2),
        },
        "monthly": monthly_data,
        "top_providers": provider_stats[:10],
        "top_listings": listing_stats[:10],
        "service_breakdown": service_breakdown,
        "recent_activity": recent_activity,
    }


@router.get("/listings/featured")
def get_featured_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admins only")
    listings = (
        db.query(Listing)
        .filter(Listing.is_featured.is_(True))
        .all()
    )
    return [
        {
            "id": l.id,
            "title": l.title,
            "location": l.location,
            "service_type": l.service_type,
            "price_per_night": l.price_per_night,
            "image_url": l.image_url,
            "is_featured": bool(l.is_featured),
        }
        for l in listings
    ]


@router.patch("/listings/{listing_id}/feature")
def toggle_listing_featured(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admins only")
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(404, "Not found")
    listing.is_featured = not bool(listing.is_featured)
    db.commit()
    db.refresh(listing)
    return {
        "id": listing_id,
        "is_featured": bool(listing.is_featured),
    }

