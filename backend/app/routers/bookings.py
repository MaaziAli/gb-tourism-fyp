"""
Bookings router - create, list, and cancel bookings.
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.coupon_helpers import record_coupon_use, validate_coupon_logic
from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.booking import Booking
from app.models.coupon import Coupon
from app.models.listing import Listing
from app.models.loyalty import LoyaltyTransaction
from app.models.review import Review
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse
from app.utils.notify import create_notification

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
    subtotal = nights * price_per_night
    total_price = subtotal
    discount = 0.0
    coupon_obj = None
    if body.coupon_code and body.coupon_code.strip():
        code_norm = body.coupon_code.upper().strip()
        coupon_obj = db.query(Coupon).filter(Coupon.code == code_norm).first()
        if not coupon_obj:
            raise HTTPException(status_code=400, detail="Invalid coupon code")
        ok, msg, discount = validate_coupon_logic(
            coupon_obj,
            current_user.id,
            subtotal,
            body.listing_id,
            db,
            listing_owner_id=listing.owner_id,
        )
        if not ok:
            raise HTTPException(status_code=400, detail=msg)
        total_price = max(0, round(subtotal - discount, 2))

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
    db.flush()
    if coupon_obj:
        record_coupon_use(db, coupon_obj, current_user.id, booking.id, discount)
    db.commit()
    db.refresh(booking)

    # Notify the traveler
    create_notification(
        db,
        user_id=current_user.id,
        title="Booking Confirmed! 🎉",
        message=(
            f"Your booking for '{listing.title}' "
            f"from {body.check_in} to {body.check_out} "
            f"is confirmed. Total: PKR {total_price:,.0f}"
        ),
        type="success",
    )

    # Notify the listing owner (provider)
    create_notification(
        db,
        user_id=listing.owner_id,
        title="New Booking Received! 📅",
        message=(
            f"{current_user.full_name} booked "
            f"'{listing.title}' from {body.check_in} "
            f"to {body.check_out}. "
            f"Revenue: PKR {total_price:,.0f}"
        ),
        type="booking",
    )

    try:
        from app.utils.loyalty_utils import (
            BONUS_POINTS,
            add_points,
            calculate_points_for_amount,
            check_first_booking,
            get_or_create_account,
        )

        get_or_create_account(db, current_user.id)

        if booking.total_price > 0:
            is_first = check_first_booking(db, current_user.id)
            if is_first:
                add_points(
                    db,
                    user_id=current_user.id,
                    points=BONUS_POINTS["first_booking"],
                    transaction_type="first_booking",
                    description="🎉 First booking bonus!",
                    reference_id=booking.id,
                )
            account = get_or_create_account(db, current_user.id)
            earned = calculate_points_for_amount(
                booking.total_price,
                account.tier,
            )
            if earned > 0:
                add_points(
                    db,
                    user_id=current_user.id,
                    points=earned,
                    transaction_type="booking_earn",
                    description=(
                        f"Points for booking '{listing.title}' "
                        f"(PKR {booking.total_price:,.0f})"
                    ),
                    reference_id=booking.id,
                )

            from app.utils.notify import create_notification as _loyalty_notif

            total_earned = earned + (
                BONUS_POINTS["first_booking"] if is_first else 0
            )
            if total_earned > 0:
                _loyalty_notif(
                    db,
                    user_id=current_user.id,
                    title=f"+{total_earned} Points Earned!",
                    message=(
                        f"You earned {total_earned} loyalty points for your "
                        f"booking at '{listing.title}'."
                    ),
                    type="success",
                )
    except Exception:
        pass

    return booking


@router.get("/me")
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).order_by(Booking.created_at.desc()).all()

    result = []
    for b in bookings:
        listing = db.query(Listing).filter(
            Listing.id == b.listing_id
        ).first()
        pe = (
            db.query(
                func.coalesce(func.sum(LoyaltyTransaction.points), 0)
            )
            .filter(
                LoyaltyTransaction.user_id == current_user.id,
                LoyaltyTransaction.reference_id == b.id,
                LoyaltyTransaction.transaction_type.in_(
                    ["booking_earn", "first_booking"]
                ),
            )
            .scalar()
        )
        points_earned = int(pe or 0)
        result.append({
            "id": b.id,
            "listing_id": b.listing_id,
            "listing_title": listing.title
                             if listing else "Unknown",
            "location": listing.location
                        if listing else "",
            "image_url": listing.image_url
                         if listing else None,
            "check_in": b.check_in.isoformat()
                        if b.check_in else None,
            "check_out": b.check_out.isoformat()
                         if b.check_out else None,
            "total_price": b.total_price,
            "status": b.status or "active",
            "room_type_id": b.room_type_id
                            if hasattr(b, 'room_type_id')
                            else None,
            "room_type_name": b.room_type_name
                              if hasattr(b, 'room_type_name')
                              else None,
            "payment_status": getattr(b, 'payment_status', 'unpaid'),
            "created_at": b.created_at.isoformat()
                          if b.created_at else None,
            "group_size": getattr(b, "group_size", None) or 1,
            "is_group_booking": bool(
                getattr(b, "is_group_booking", False)
            ),
            "group_lead_name": getattr(b, "group_lead_name", None),
            "group_discount_applied": float(
                getattr(b, "group_discount_applied", 0) or 0
            ),
            "price_per_person": getattr(b, "price_per_person", None),
            "special_requirements": getattr(
                b, "special_requirements", None
            ),
            "points_earned": points_earned,
        })
    return result


@router.get("/provider/dashboard")
def get_provider_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(403, "Providers only")

    from datetime import datetime, timedelta

    from app.models.event import Event
    from app.models.ticket_booking import TicketBooking

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    listings = db.query(Listing).filter(Listing.owner_id == current_user.id).all()
    listing_ids = [l.id for l in listings]
    listing_map = {l.id: l for l in listings}

    events = db.query(Event).filter(Event.organizer_id == current_user.id).all()
    event_ids = [e.id for e in events]

    if listing_ids:
        all_bookings = (
            db.query(Booking)
            .filter(
                Booking.listing_id.in_(listing_ids),
                Booking.status != "cancelled",
            )
            .all()
        )
    else:
        all_bookings = []

    month_bookings = [
        b for b in all_bookings if b.created_at and b.created_at >= month_start
    ]
    last_month_bookings = [
        b
        for b in all_bookings
        if b.created_at and last_month_start <= b.created_at < month_start
    ]

    total_revenue = sum(b.total_price or 0 for b in all_bookings)
    month_revenue = sum(b.total_price or 0 for b in month_bookings)
    last_month_revenue = sum(b.total_price or 0 for b in last_month_bookings)
    commission_rate = 0.10
    net_earnings = round(total_revenue * (1 - commission_rate), 2)
    month_net = round(month_revenue * (1 - commission_rate), 2)

    if last_month_revenue > 0:
        revenue_change = round(
            ((month_revenue - last_month_revenue) / last_month_revenue) * 100, 1
        )
    else:
        revenue_change = 100 if month_revenue > 0 else 0

    if event_ids:
        event_bookings = (
            db.query(TicketBooking)
            .filter(
                TicketBooking.event_id.in_(event_ids),
                TicketBooking.status == "confirmed",
            )
            .all()
        )
    else:
        event_bookings = []

    event_revenue = sum(b.organizer_amount or 0 for b in event_bookings)

    if listing_ids:
        all_reviews = db.query(Review).filter(Review.listing_id.in_(listing_ids)).all()
    else:
        all_reviews = []

    avg_rating = (
        round(sum(r.rating for r in all_reviews) / max(1, len(all_reviews)), 1)
        if all_reviews
        else 0
    )

    recent_bookings = sorted(
        all_bookings,
        key=lambda b: b.created_at or datetime.min,
        reverse=True,
    )[:8]

    recent_list = []
    for b in recent_bookings:
        guest = db.query(User).filter(User.id == b.user_id).first()
        listing = listing_map.get(b.listing_id)
        recent_list.append(
            {
                "id": b.id,
                "guest_name": guest.full_name if guest else "Unknown",
                "guest_email": guest.email if guest else "",
                "listing_title": listing.title if listing else "Unknown",
                "service_type": listing.service_type if listing else "",
                "check_in": b.check_in.isoformat() if b.check_in else None,
                "check_out": b.check_out.isoformat() if b.check_out else None,
                "total_price": b.total_price or 0,
                "net_amount": round((b.total_price or 0) * 0.90, 2),
                "status": b.status,
                "payment_status": getattr(b, "payment_status", "unknown"),
                "group_size": getattr(b, "group_size", 1) or 1,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
        )

    listing_stats = []
    for listing in listings:
        l_bookings = [b for b in all_bookings if b.listing_id == listing.id]
        l_reviews = [r for r in all_reviews if r.listing_id == listing.id]
        l_revenue = sum(b.total_price or 0 for b in l_bookings)
        l_avg = (
            round(sum(r.rating for r in l_reviews) / max(1, len(l_reviews)), 1)
            if l_reviews
            else 0
        )

        listing_stats.append(
            {
                "id": listing.id,
                "title": listing.title,
                "service_type": listing.service_type,
                "location": listing.location,
                "price_per_night": listing.price_per_night,
                "image_url": listing.image_url,
                "bookings_count": len(l_bookings),
                "revenue": round(l_revenue, 2),
                "net_earnings": round(l_revenue * 0.90, 2),
                "avg_rating": l_avg,
                "review_count": len(l_reviews),
            }
        )

    listing_stats.sort(key=lambda x: x["revenue"], reverse=True)

    monthly = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=i * 30)
        m_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = m_start + timedelta(days=32)
        m_bookings = [
            b for b in all_bookings if b.created_at and m_start <= b.created_at < m_end
        ]
        m_rev = sum(b.total_price or 0 for b in m_bookings)
        monthly.append(
            {
                "month": d.strftime("%b"),
                "revenue": round(m_rev, 2),
                "net": round(m_rev * 0.90, 2),
                "bookings": len(m_bookings),
            }
        )

    return {
        "summary": {
            "total_listings": len(listings),
            "active_listings": len(listings),
            "total_bookings": len(all_bookings),
            "month_bookings": len(month_bookings),
            "total_revenue": round(total_revenue, 2),
            "month_revenue": round(month_revenue, 2),
            "net_earnings": net_earnings,
            "month_net": month_net,
            "revenue_change": revenue_change,
            "event_revenue": round(event_revenue, 2),
            "total_events": len(events),
            "total_reviews": len(all_reviews),
            "avg_rating": avg_rating,
            "commission_rate": commission_rate,
        },
        "recent_bookings": recent_list,
        "listing_stats": listing_stats,
        "monthly_trend": monthly,
    }


@router.get("/provider/earnings-breakdown")
def get_earnings_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(403, "Providers only")

    from datetime import datetime, timedelta

    from app.models.event import Event
    from app.models.ticket_booking import TicketBooking

    now = datetime.utcnow()

    listings = db.query(Listing).filter(
        Listing.owner_id == current_user.id
    ).all()
    listing_ids = [l.id for l in listings]

    if listing_ids:
        all_bookings = (
            db.query(Booking)
            .filter(
                Booking.listing_id.in_(listing_ids),
                Booking.status != "cancelled",
                Booking.total_price > 0,
            )
            .all()
        )
    else:
        all_bookings = []

    monthly = []
    for i in range(11, -1, -1):
        d = now - timedelta(days=i * 30)
        m_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = m_start + timedelta(days=32)
        m_label = d.strftime("%b %Y")
        m_short = d.strftime("%b")

        m_bookings = [
            b
            for b in all_bookings
            if b.created_at and m_start <= b.created_at < m_end
        ]
        m_gross = sum(b.total_price or 0 for b in m_bookings)
        m_commission = round(m_gross * 0.10, 2)
        m_net = round(m_gross - m_commission, 2)

        monthly.append(
            {
                "month": m_label,
                "short": m_short,
                "gross": round(m_gross, 2),
                "commission": m_commission,
                "net": m_net,
                "bookings": len(m_bookings),
            }
        )

    weekly = []
    for i in range(7, -1, -1):
        w_start = now - timedelta(days=(i + 1) * 7)
        w_end = now - timedelta(days=i * 7)
        label = f"W{8 - i}"
        if i == 0:
            label = "This Week"
        elif i == 1:
            label = "Last Week"

        w_bookings = [
            b
            for b in all_bookings
            if b.created_at and w_start <= b.created_at < w_end
        ]
        w_gross = sum(b.total_price or 0 for b in w_bookings)
        w_comm = round(w_gross * 0.10, 2)
        weekly.append(
            {
                "week": label,
                "gross": round(w_gross, 2),
                "commission": w_comm,
                "net": round(w_gross * 0.90, 2),
                "bookings": len(w_bookings),
            }
        )

    service_breakdown: dict = {}
    for b in all_bookings:
        listing = next(
            (l for l in listings if l.id == b.listing_id),
            None,
        )
        if not listing:
            continue
        st = listing.service_type
        if st not in service_breakdown:
            service_breakdown[st] = {
                "type": st,
                "gross": 0,
                "net": 0,
                "bookings": 0,
            }
        gross = b.total_price or 0
        service_breakdown[st]["gross"] += gross
        service_breakdown[st]["net"] += round(gross * 0.90, 2)
        service_breakdown[st]["bookings"] += 1

    service_list = sorted(
        service_breakdown.values(),
        key=lambda x: x["gross"],
        reverse=True,
    )

    events = db.query(Event).filter(
        Event.organizer_id == current_user.id
    ).all()
    event_ids = [e.id for e in events]
    if event_ids:
        event_bookings = (
            db.query(TicketBooking)
            .filter(
                TicketBooking.event_id.in_(event_ids),
                TicketBooking.status == "confirmed",
            )
            .all()
        )
    else:
        event_bookings = []

    event_earnings = sum(
        b.organizer_amount or 0 for b in event_bookings
    )

    total_gross = sum(b.total_price or 0 for b in all_bookings)
    total_commission = round(total_gross * 0.10, 2)
    total_net = round(total_gross * 0.90, 2)

    return {
        "totals": {
            "gross": round(total_gross, 2),
            "commission": total_commission,
            "net": total_net,
            "event_earnings": round(event_earnings, 2),
            "total_earnings": round(total_net + event_earnings, 2),
            "bookings_count": len(all_bookings),
        },
        "monthly": monthly,
        "weekly": weekly,
        "by_service": service_list,
    }


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


@router.get("/{booking_id}/voucher")
def get_booking_voucher(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full voucher data for a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    listing = db.query(Listing).filter(
        Listing.id == booking.listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    if (
        booking.user_id != current_user.id
        and listing.owner_id != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(403, "Not authorized")

    guest = db.query(User).filter(User.id == booking.user_id).first()
    provider = (
        db.query(User).filter(User.id == listing.owner_id).first()
        if listing
        else None
    )

    booking_ref = f"GBT-{booking_id:06d}"

    ci = booking.check_in
    co = booking.check_out
    nights = 1
    if ci is not None and co is not None:
        nights = max(1, (co - ci).days)

    def _date_iso(d):
        if d is None:
            return None
        return d.isoformat() if hasattr(d, "isoformat") else str(d)

    room_name = None
    if getattr(booking, "room_type_id", None):
        from app.models.room_type import RoomType

        room = db.query(RoomType).filter(
            RoomType.id == booking.room_type_id
        ).first()
        if room:
            room_name = room.name

    check_in_s = _date_iso(booking.check_in)
    check_out_s = _date_iso(booking.check_out)

    return {
        "booking_ref": booking_ref,
        "booking_id": booking_id,
        "status": booking.status,
        "payment_status": getattr(booking, "payment_status", "unknown"),
        "guest": {
            "name": guest.full_name if guest else "Guest",
            "email": guest.email if guest else "",
        },
        "listing": {
            "id": listing.id if listing else None,
            "title": listing.title if listing else "Unknown",
            "location": listing.location if listing else "",
            "service_type": listing.service_type if listing else "",
            "address": listing.location if listing else "",
            "image_url": listing.image_url if listing else None,
        },
        "provider": {
            "name": provider.full_name if provider else "Provider",
            "email": provider.email if provider else "",
        },
        "dates": {
            "check_in": check_in_s,
            "check_out": check_out_s,
            "nights": nights,
        },
        "room_type": room_name,
        "group_size": getattr(booking, "group_size", 1) or 1,
        "total_price": booking.total_price or 0,
        "group_lead_name": getattr(booking, "group_lead_name", None),
        "created_at": booking.created_at.isoformat()
        if booking.created_at
        else None,
        "qr_data": (
            "GB-TOURISM-VOUCHER|"
            f"REF:{booking_ref}|"
            f"BOOKING:{booking_id}|"
            f"GUEST:{guest.full_name if guest else ''}|"
            f"CHECKIN:{check_in_s or ''}|"
            f"LISTING:{listing.title if listing else ''}"
        ),
    }


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
    listing = (
        db.query(Listing).filter(Listing.id == booking.listing_id).first()
    )
    db.commit()
    db.refresh(booking)

    if listing:
        create_notification(
            db,
            user_id=current_user.id,
            title="Booking Cancelled",
            message=f"Your booking for '{listing.title}' has been cancelled.",
            type="warning",
        )

    return booking
