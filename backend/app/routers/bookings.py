"""
Bookings router - create, list, and cancel bookings.
"""
from datetime import date as date_type, timedelta
from datetime import datetime, time, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.coupon_helpers import record_coupon_use, validate_coupon_logic
from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.booking import Booking
from app.models.coupon import Coupon
from app.models.listing import Listing
from app.models.loyalty import LoyaltyTransaction
from app.models.payment import Payment
from app.models.refund import Refund
from app.models.review import Review
from app.models.room_hold import RoomHold
from app.models.room_type import RoomType
from app.models.tour_date_capacity import TourDateCapacity
from app.models.user import User
from app.schemas.booking import (
    BookingCancellationResponse,
    BookingCreate,
    BookingModifyRequest,
    BookingResponse,
    RoomSelectionResponse,
    InvoiceResponse,
)
from app.websockets.connection_manager import manager
from app.utils.loyalty_utils import (
    get_or_create_account as _get_loyalty_account,
    pkr_to_points,
    points_to_pkr,
    redeem_points,
    redeem_points_transactional,
)
from app.utils.notify import create_notification


def _calculate_refund_amount(booking: Booking, listing: Listing, now: datetime) -> float:
    """Return the refund amount in PKR based on the listing's cancellation policy."""
    policy = listing.cancellation_policy or "moderate"
    hours_free = listing.cancellation_hours_free or 48

    check_in_dt = datetime.combine(booking.check_in, time(14, 0))
    diff_seconds = (check_in_dt - now).total_seconds()
    diff_hours = diff_seconds / 3600
    diff_days = (booking.check_in - now.date()).days

    # After check-in: no refund for any policy (no-show / late cancel)
    if diff_days < 0:
        return 0.0

    if policy == "flexible":
        if diff_hours >= hours_free:
            return booking.total_price                      # full refund
        elif diff_hours > 0:
            return round(booking.total_price * 0.5, 2)     # 50% within window
        else:
            return 0.0                                      # same-day / no-show
    elif policy == "moderate":
        if diff_days >= 5:
            return booking.total_price                      # full refund
        else:
            return 0.0                                      # no refund within 5 days
    elif policy == "strict":
        if diff_days >= 7:
            return round(booking.total_price * 0.5, 2)     # 50% refund
        else:
            return 0.0                                      # no refund within 7 days
    return 0.0


def _refund_reason(policy: str, refund_amount: float, total_price: float) -> str:
    if refund_amount == 0:
        return "No refund per cancellation policy"
    if refund_amount >= total_price:
        return f"Full refund per '{policy}' cancellation policy"
    return f"Partial refund (50%) per '{policy}' cancellation policy"

SINGLE_DATE_TYPES = {"tour", "activity", "horse_riding", "guide"}

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def auto_checkout_overdue(db: Session) -> int:
    """
    Marks checked-in bookings as checked-out if check_out date has passed.
    Returns count of bookings auto-checked-out.
    Call this from a scheduled job or on-demand.
    """
    from datetime import datetime, timezone, date

    today = datetime.now(timezone.utc).date()
    overdue = (
        db.query(Booking)
        .filter(
            Booking.checked_in_at.isnot(None),
            Booking.checked_out_at.is_(None),
            Booking.status != "cancelled",
            Booking.check_out < today,
        )
        .all()
    )
    count = 0
    for b in overdue:
        b.checked_out_at = datetime.now(timezone.utc)
        b.status = "completed"
        count += 1
    if count:
        db.commit()
    return count


def _get_seasonal_subtotal(
    db: Session,
    listing_id: int,
    check_in: date_type,
    check_out: date_type,
    base_price: float,
    is_single_date: bool,
) -> tuple[float, bool]:
    """
    Return (adjusted_subtotal, seasonal_applied).

    For date-range services: iterate each night and apply the best active
    seasonal rule per night, then sum.
    For single-date services: apply the best active seasonal rule to the
    single check_in date.

    Rule priority: highest price_multiplier wins; on a tie, surcharges are
    summed across all tied rules.
    """
    from app.models.seasonal_price import SeasonalPrice

    rules = (
        db.query(SeasonalPrice)
        .filter(
            SeasonalPrice.listing_id == listing_id,
            SeasonalPrice.is_active.is_(True),
        )
        .all()
    )
    if not rules:
        nights = 1 if is_single_date else (check_out - check_in).days
        return round(base_price * nights, 2), False

    def best_for_date(dt: date_type) -> tuple[float, float]:
        """Return (best_multiplier, combined_surcharge) for a single date."""
        best_mult = 1.0
        surcharge = 0.0
        for r in rules:
            if r.start_date <= dt <= r.end_date:
                if r.price_multiplier > best_mult:
                    best_mult = r.price_multiplier
                    surcharge = r.fixed_surcharge
                elif r.price_multiplier == best_mult:
                    surcharge += r.fixed_surcharge
        return best_mult, surcharge

    if is_single_date:
        mult, sur = best_for_date(check_in)
        total = round((base_price * mult) + sur, 2)
        applied = mult != 1.0 or sur != 0.0
        return total, applied

    # Date-range: sum each night
    nights = (check_out - check_in).days
    total = 0.0
    applied = False
    for i in range(nights):
        night = check_in + timedelta(days=i)
        mult, sur = best_for_date(night)
        total += (base_price * mult) + sur
        if mult != 1.0 or sur != 0.0:
            applied = True
    return round(total, 2), applied


@router.post("/", response_model=BookingResponse)
async def create_booking(
    body: BookingCreate,
    background_tasks: BackgroundTasks,
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

    is_single_date = listing.service_type in SINGLE_DATE_TYPES

    today = date_type.today()
    if body.check_in < today:
        raise HTTPException(
            status_code=400,
            detail="Check-in date cannot be in the past",
        )

    if is_single_date:
        # Tours/activities use a single date; check_out is ignored
        effective_check_out = body.check_in
    else:
        if body.check_out <= body.check_in:
            raise HTTPException(
                status_code=400,
                detail="Check-out must be after check-in",
            )
        effective_check_out = body.check_out

    room_quantity = max(1, getattr(body, 'room_quantity', 1) or 1)

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

    # Lookup table for multi-room availability check and price calculation
    rt_lookup: dict[int, object] = {}

    # Availability check
    if room_type:
        # Per-room-type real-time availability: count overlapping active bookings
        booked_count = (
            db.query(func.count(Booking.id))
            .filter(
                Booking.room_type_id == body.room_type_id,
                Booking.status.in_(["active", "confirmed"]),
                Booking.check_in < effective_check_out,
                Booking.check_out > body.check_in,
            )
            .scalar() or 0
        )
        # Also subtract active (non-expired) holds to prevent double-booking
        held_count = (
            db.query(func.sum(RoomHold.quantity))
            .filter(
                RoomHold.room_type_id == body.room_type_id,
                RoomHold.status == "active",
                RoomHold.hold_expires_at > datetime.utcnow(),
            )
            .scalar() or 0
        )
        available = (room_type.total_rooms or 1) - booked_count - held_count
        if available < room_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {available} room(s) available for the selected dates",
            )
    elif is_single_date:
        # Capacity check for tours/activities
        custom_capacity = (
            db.query(TourDateCapacity)
            .filter(
                TourDateCapacity.listing_id == listing.id,
                TourDateCapacity.tour_date == body.check_in,
            )
            .first()
        )
        capacity = (
            custom_capacity.capacity
            if custom_capacity is not None
            else listing.max_capacity_per_day
        )
        if capacity is not None:
            booked_count = (
                db.query(func.count(Booking.id))
                .filter(
                    Booking.listing_id == listing.id,
                    Booking.status.in_(["active", "confirmed"]),
                    Booking.check_in == body.check_in,
                )
                .scalar() or 0
            )
            if booked_count >= capacity:
                raise HTTPException(
                    status_code=400,
                    detail="No spots left on this date",
                )
    else:
        # Generic listing-level check for non-hotel / no room type selected
        overlapping = (
            db.query(Booking)
            .filter(
                Booking.listing_id == body.listing_id,
                Booking.status == "active",
                Booking.check_in < effective_check_out,
                Booking.check_out > body.check_in,
            )
            .first()
        )
        if overlapping:
            raise HTTPException(
                status_code=400,
                detail="Booking conflict: dates overlap with existing booking",
            )

    # ── Multi-room availability check ────────────────────────────────────
    if body.room_selections:
        from app.models.room_type import RoomType as _RoomType
        for sel in body.room_selections:
            rt = (
                db.query(_RoomType)
                .filter(
                    _RoomType.id == sel.room_type_id,
                    _RoomType.listing_id == listing.id,
                )
                .first()
            )
            if not rt:
                raise HTTPException(
                    status_code=404,
                    detail=f"Room type {sel.room_type_id} not found for this listing",
                )
            mr_booked = (
                db.query(func.count(Booking.id))
                .filter(
                    Booking.room_type_id == sel.room_type_id,
                    Booking.status.in_(["active", "confirmed"]),
                    Booking.check_in < effective_check_out,
                    Booking.check_out > body.check_in,
                )
                .scalar() or 0
            )
            mr_held = (
                db.query(func.sum(RoomHold.quantity))
                .filter(
                    RoomHold.room_type_id == sel.room_type_id,
                    RoomHold.status == "active",
                    RoomHold.hold_expires_at > datetime.utcnow(),
                )
                .scalar() or 0
            )
            mr_available = (rt.total_rooms or 1) - mr_booked - mr_held
            if mr_available < sel.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Only {mr_available} room(s) available for "
                        f"room type '{rt.name}' on the selected dates"
                    ),
                )
            rt_lookup[sel.room_type_id] = rt

    price_per_night = (
        room_type.price_per_night if room_type else listing.price_per_night
    )
    nights = 1 if is_single_date else (effective_check_out - body.check_in).days

    # ── Seasonal pricing adjustment ───────────────────────────────────────
    # The helper returns the full date-range subtotal with per-night
    # multipliers already applied, so we override subtotal below.
    seasonal_subtotal, seasonal_applied = _get_seasonal_subtotal(
        db,
        listing_id=body.listing_id,
        check_in=body.check_in,
        check_out=effective_check_out,
        base_price=price_per_night,
        is_single_date=is_single_date,
    )

    # ── Car rental: merge defaults and compute insurance ──────────────────
    rental_details_final = None
    insurance_total = 0.0
    if listing.service_type == "car_rental":
        rd = body.rental_details or {}
        lpu = getattr(listing, "pickup_location", None) or listing.location
        rental_details_final = {
            "pickup_location": rd.get("pickup_location") or lpu,
            "dropoff_location": rd.get("dropoff_location") or getattr(listing, "dropoff_location", None) or rd.get("pickup_location") or lpu,
            "pickup_time": rd.get("pickup_time") or getattr(listing, "pickup_time", None) or "09:00",
            "dropoff_time": rd.get("dropoff_time") or getattr(listing, "dropoff_time", None) or "18:00",
            "selected_insurance": rd.get("selected_insurance") or [],
            "fuel_policy": rd.get("fuel_policy") or getattr(listing, "fuel_policy", None) or "full_to_full",
            "extra_requests": rd.get("extra_requests") or "",
        }
        # Fetch current insurance options from the listing
        current_insurance_options = getattr(listing, "insurance_options", None) or []
        ins_opts = {opt["name"]: opt["price_per_day"] for opt in current_insurance_options}

        selected_names = rental_details_final["selected_insurance"]
        # --- VALIDATION: Ensure all requested insurances exist ---
        for ins_name in selected_names:
            if ins_name not in ins_opts:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insurance option '{ins_name}' is no longer available. Please refresh and try again."
                )

        # Calculate insurance cost and build breakdown
        ins_breakdown = []
        for ins_name in selected_names:
            ppd = ins_opts[ins_name]  # guaranteed to exist after validation
            cost = round(float(ppd) * nights, 2)
            insurance_total += cost
            ins_breakdown.append({"name": ins_name, "price_per_day": ppd, "total": cost})
        insurance_total = round(insurance_total, 2)

        # --- Store snapshot and timestamp ---
        rental_details_final["insurance_breakdown"] = ins_breakdown
        rental_details_final["insurance_total"] = insurance_total
        rental_details_final["insurance_validated_at"] = datetime.utcnow().isoformat()
        rental_details_final["insurance_snapshot"] = current_insurance_options

    subtotal = seasonal_subtotal   # already accounts for seasonal multipliers
    total_price = subtotal

    # ── Multi-room price override ─────────────────────────────────────────
    # When room_selections are provided, replace the single-room price with
    # the sum across all selected room types.  subtotal is kept in sync so
    # coupon / loyalty discount logic operates on the correct base.
    if body.room_selections:
        mr_nights = (effective_check_out - body.check_in).days or 1
        total_price = sum(
            float(rt_lookup[sel.room_type_id].price_per_night) * sel.quantity * mr_nights
            for sel in body.room_selections
        )
        subtotal = total_price

    coupon_discount = 0.0
    coupon_obj = None
    if body.coupon_code and body.coupon_code.strip():
        code_norm = body.coupon_code.upper().strip()
        coupon_obj = db.query(Coupon).filter(Coupon.code == code_norm).first()
        if not coupon_obj:
            raise HTTPException(status_code=400, detail="Invalid coupon code")
        ok, msg, coupon_discount = validate_coupon_logic(
            coupon_obj,
            current_user.id,
            subtotal,
            body.listing_id,
            db,
            listing_owner_id=listing.owner_id,
        )
        if not ok:
            raise HTTPException(status_code=400, detail=msg)
        total_price = max(0, round(subtotal - coupon_discount, 2))

    # ── Loyalty points redemption ────────────────────────────────────────
    loyalty_points_used = 0
    loyalty_discount = 0.0
    requested_points = body.loyalty_points_used or 0
    if requested_points > 0:
        loyalty_account = _get_loyalty_account(db, current_user.id)
        if requested_points > loyalty_account.total_points:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough loyalty points. "
                    f"You have {loyalty_account.total_points:,} points available."
                ),
            )
        # Cap discount at 50% of the original subtotal (consistent with
        # the /loyalty/calculate-redeem endpoint)
        max_loyalty_discount = round(subtotal * 0.5, 2)
        raw_discount = points_to_pkr(requested_points)
        loyalty_discount = min(raw_discount, max_loyalty_discount)
        # If the cap reduced the discount, also reduce the points used
        if loyalty_discount < raw_discount:
            loyalty_points_used = pkr_to_points(loyalty_discount)
        else:
            loyalty_points_used = requested_points
        loyalty_discount = round(loyalty_discount, 2)
        total_price = max(0, round(subtotal - coupon_discount - loyalty_discount, 2))

    # Insurance is added after discounts (coupon/loyalty apply to base price only)
    if insurance_total > 0:
        total_price = round(total_price + insurance_total, 2)

    # Create a room hold before booking to prevent concurrent double-booking
    room_hold = None
    if room_type:
        room_hold = RoomHold(
            room_type_id=body.room_type_id,
            quantity=room_quantity,
            hold_expires_at=datetime.utcnow() + timedelta(minutes=10),
            status="active",
        )
        db.add(room_hold)
        db.flush()  # assign room_hold.id without committing

    booking = Booking(
        listing_id=body.listing_id,
        user_id=current_user.id,
        check_in=body.check_in,
        check_out=effective_check_out,
        total_price=total_price,
        status="active",
        room_type_id=body.room_type_id if body.room_type_id else None,
        room_type_name=room_type.name if room_type else None,
        group_size=max(1, body.guests or 1),
        loyalty_points_used=loyalty_points_used,
        loyalty_discount_applied=loyalty_discount,
        rental_details=rental_details_final,
    )
    db.add(booking)
    db.flush()  # assign booking.id without committing

    # Link hold to booking and mark as converted
    if room_hold:
        room_hold.booking_id = booking.id
        room_hold.status = "converted"
        db.add(room_hold)

    if coupon_obj:
        record_coupon_use(db, coupon_obj, current_user.id, booking.id, coupon_discount)

    # ── Stage loyalty deduction in the same transaction ─────────────────
    # redeem_points_transactional() does NOT call db.commit(), so if it
    # raises ValueError (e.g. race-condition: points depleted between
    # validation and here) we roll back everything — no booking, no
    # coupon usage, no deduction.  db.commit() below is the single
    # commit that persists all three writes atomically.
    if loyalty_points_used > 0:
        try:
            redeem_points_transactional(
                db,
                user_id=current_user.id,
                points=loyalty_points_used,
                description=(
                    f"Redeemed for booking #{booking.id} "
                    f"at '{listing.title}' "
                    f"(saved PKR {loyalty_discount:,.0f})"
                ),
                reference_id=booking.id,
            )
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(exc))

    db.commit()   # ← one commit: booking + coupon usage + loyalty deduction
    db.refresh(booking)

    # ── Persist multi-room breakdown rows ────────────────────────────────
    if body.room_selections:
        from app.models.booking_room import BookingRoom as _BookingRoom
        for sel in body.room_selections:
            rt = rt_lookup[sel.room_type_id]
            db.add(_BookingRoom(
                booking_id=booking.id,
                room_type_id=sel.room_type_id,
                quantity=sel.quantity,
                unit_price=rt.price_per_night,
            ))
        db.commit()
        db.refresh(booking)   # reload so room_selections relationship is populated

    # Broadcast real-time availability update to all connected WS clients
    import asyncio
    try:
        asyncio.create_task(
            manager.broadcast(
                booking.listing_id,
                {
                    "event": "availability_updated",
                    "listing_id": booking.listing_id,
                    "booking_id": booking.id,
                    "message": "Availability has been updated. Please refresh."
                }
            )
        )
    except RuntimeError:
        # No running event loop (e.g. during tests or sync endpoint) — skip broadcast silently
        pass

    # Notify the traveler
    savings_note = ""
    total_savings = 0.0
    if coupon_discount > 0 or loyalty_discount > 0:
        total_savings = coupon_discount + loyalty_discount
        savings_note = f" You saved PKR {total_savings:,.0f}!"
    create_notification(
        db,
        user_id=current_user.id,
        title="Booking Confirmed!",
        message=(
            f"Your booking for '{listing.title}' "
            f"from {body.check_in} to {effective_check_out} "
            f"is confirmed. Total: PKR {total_price:,.0f}.{savings_note}"
        ),
        type="success",
        email_type="booking_created",
        email_context={
            "booking_id":     booking.id,
            "listing_title":  listing.title,
            "location":       listing.location or "",
            "check_in":       str(body.check_in),
            "check_out":      str(effective_check_out),
            "room_type_name": booking.room_type_name or "",
            "guests":         booking.group_size or 1,
            "total_price":    f"{total_price:,.0f}",
            "savings":        f"{total_savings:,.0f}" if total_savings > 0 else "",
            "payment_status": booking.payment_status or "unpaid",
        },
        background_tasks=background_tasks,
    )

    # Notify the listing owner (provider)
    commission = round(total_price * 0.10, 2)
    provider_amount = round(total_price - commission, 2)
    create_notification(
        db,
        user_id=listing.owner_id,
        title="New Booking Received!",
        message=(
            f"{current_user.full_name} booked "
            f"'{listing.title}' from {body.check_in} "
            f"to {effective_check_out}. "
            f"Revenue: PKR {total_price:,.0f}"
        ),
        type="booking",
        email_type="booking_created_provider",
        email_context={
            "booking_id":     booking.id,
            "listing_title":  listing.title,
            "guest_name":     current_user.full_name,
            "check_in":       str(body.check_in),
            "check_out":      str(effective_check_out),
            "room_type_name": booking.room_type_name or "",
            "guests":         booking.group_size or 1,
            "total_price":    f"{total_price:,.0f}",
            "commission":     f"{commission:,.0f}",
            "provider_amount": f"{provider_amount:,.0f}",
        },
        background_tasks=background_tasks,
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

    # ── Build response with room breakdown ───────────────────────────────
    # Eagerly load room_selections relationship before the session closes
    _ = booking.room_selections

    room_sel_responses = []
    if booking.room_selections:
        bk_nights = (booking.check_out - booking.check_in).days or 1
        for br in booking.room_selections:
            room_sel_responses.append(
                RoomSelectionResponse(
                    room_type_id=br.room_type_id,
                    room_type_name=br.room_type.name,
                    quantity=br.quantity,
                    unit_price=float(br.unit_price),
                    subtotal=float(br.unit_price) * br.quantity * bk_nights,
                )
            )

    return {
        "id": booking.id,
        "listing_id": booking.listing_id,
        "user_id": booking.user_id,
        "total_price": booking.total_price,
        "status": booking.status,
        "payment_status": booking.payment_status,
        "check_in": booking.check_in,
        "check_out": booking.check_out,
        "created_at": booking.created_at,
        "room_type_id": booking.room_type_id,
        "room_type_name": booking.room_type_name,
        "loyalty_points_used": booking.loyalty_points_used,
        "loyalty_discount_applied": booking.loyalty_discount_applied,
        "room_selections": room_sel_responses,
    }


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
            "rental_details": getattr(b, "rental_details", None),
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
                "checked_in_at": b.checked_in_at.isoformat() if getattr(b, "checked_in_at", None) else None,
                "checked_out_at": b.checked_out_at.isoformat() if getattr(b, "checked_out_at", None) else None,
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


@router.get("/provider/calendar")
def get_provider_calendar(
    year: int,
    month: int,
    provider_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(status_code=403, detail="Providers only")
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    start_date = date_type(year, month, 1)
    end_date = date_type(year + 1, 1, 1) if month == 12 else date_type(year, month + 1, 1)

    listings_query = db.query(Listing.id, Listing.title)
    if current_user.role == "provider":
        listings_query = listings_query.filter(Listing.owner_id == current_user.id)
    elif provider_id:
        listings_query = listings_query.filter(Listing.owner_id == provider_id)

    listings = listings_query.all()
    if not listings:
        return {"year": year, "month": month, "bookings": []}

    listing_ids = [l.id for l in listings]
    listing_title_map = {l.id: l.title for l in listings}

    payment_subquery = (
        db.query(
            Payment.booking_id.label("booking_id"),
            func.coalesce(func.sum(Payment.provider_amount), 0.0).label("provider_amount"),
        )
        .filter(Payment.status == "completed")
        .group_by(Payment.booking_id)
        .subquery()
    )

    rows = (
        db.query(Booking, User.full_name, payment_subquery.c.provider_amount)
        .join(User, User.id == Booking.user_id)
        .outerjoin(payment_subquery, payment_subquery.c.booking_id == Booking.id)
        .filter(
            Booking.listing_id.in_(listing_ids),
            Booking.status.in_(["active", "confirmed"]),
            Booking.check_in < end_date,
            Booking.check_out >= start_date,
        )
        .order_by(Booking.check_in.asc(), Booking.id.asc())
        .all()
    )

    bookings = []
    for booking, guest_name, provider_amount in rows:
        computed_provider_amount = provider_amount
        if computed_provider_amount is None:
            computed_provider_amount = round((booking.total_price or 0) * 0.90, 2)

        bookings.append(
            {
                "id": booking.id,
                "listing_id": booking.listing_id,
                "listing_title": listing_title_map.get(booking.listing_id, f"Listing #{booking.listing_id}"),
                "guest_name": guest_name or "Unknown",
                "check_in": booking.check_in.isoformat() if booking.check_in else None,
                "check_out": booking.check_out.isoformat() if booking.check_out else None,
                "status": booking.status,
                "total_price": booking.total_price or 0.0,
                "provider_amount": round(float(computed_provider_amount), 2),
            }
        )

    return {"year": year, "month": month, "bookings": bookings}


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
        "room_selections": [
            {
                "room_type_name": (br.room_type.name if br.room_type else ""),
                "quantity": br.quantity,
                "unit_price": float(br.unit_price),
                "subtotal": float(br.unit_price) * br.quantity * nights,
            }
            for br in (booking.room_selections or [])
        ],
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


@router.patch("/{booking_id}/cancel", response_model=BookingCancellationResponse)
def cancel_booking(
    booking_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a booking and apply refund logic based on the listing's cancellation policy.

    Refund tiers:
    - flexible:  full refund if cancelled ≥ cancellation_hours_free before check-in,
                 50% within that window, no refund after check-in.
    - moderate:  full refund if ≥ 5 days before check-in, no refund otherwise.
    - strict:    50% refund if ≥ 7 days before check-in, no refund otherwise.

    payment_status is updated to 'refunded', 'partially_refunded', or stays 'paid'.
    A Refund record is created for any non-zero refund.
    Both the guest and the property owner are notified.
    """
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()

    # ── Refund calculation ────────────────────────────────────────────────
    refund_amount = 0.0
    if booking.payment_status == "paid" and listing:
        refund_amount = _calculate_refund_amount(booking, listing, datetime.utcnow())

    # ── Determine new payment_status ────────────────────────────────────
    if booking.payment_status == "paid":
        if refund_amount >= booking.total_price:
            booking.payment_status = "refunded"
        elif refund_amount > 0:
            booking.payment_status = "partially_refunded"
        # else: remains "paid" – provider keeps the money

    # ── Mark booking cancelled ───────────────────────────────────────────
    booking.status = "cancelled"

    # ── Release any associated room holds ────────────────────────────────
    holds = (
        db.query(RoomHold)
        .filter(
            RoomHold.booking_id == booking_id,
            RoomHold.status == "converted",
        )
        .all()
    )
    for hold in holds:
        hold.status = "released"
    if holds:
        db.add_all(holds)

    # ── Create Refund record if money is owed back ───────────────────────
    if refund_amount > 0:
        payment = (
            db.query(Payment)
            .filter(
                Payment.booking_id == booking.id,
                Payment.status == "completed",
            )
            .first()
        )
        policy = listing.cancellation_policy if listing else "moderate"
        refund_record = Refund(
            booking_id=booking.id,
            payment_id=payment.id if payment else None,
            amount_refunded=refund_amount,
            refund_reason=_refund_reason(policy, refund_amount, booking.total_price),
            refunded_at=datetime.utcnow(),
        )
        db.add(refund_record)

    db.commit()
    db.refresh(booking)

    # ── Loyalty points reversal (non-blocking) ───────────────────────────
    try:
        delta = datetime.now(timezone.utc) - booking.created_at.replace(tzinfo=timezone.utc)
        if delta.total_seconds() <= 86400:
            earn_txn = (
                db.query(LoyaltyTransaction)
                .filter(
                    LoyaltyTransaction.user_id == booking.user_id,
                    LoyaltyTransaction.reference_id == booking.id,
                    LoyaltyTransaction.transaction_type == "booking_earn",
                )
                .first()
            )
            if earn_txn:
                user_loyalty = _get_loyalty_account(db, booking.user_id)
                new_balance = max(0, user_loyalty.total_points - earn_txn.points)

                reversal_txn = LoyaltyTransaction(
                    user_id=booking.user_id,
                    points=-earn_txn.points,
                    transaction_type="booking_cancel_reversal",
                    reference_id=booking.id,
                    description=f"Points reversed due to booking #{booking.id} cancellation",
                    balance_after=new_balance,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(reversal_txn)
                db.flush()

                user_loyalty.total_points = new_balance
                db.add(user_loyalty)
                db.commit()

                create_notification(
                    db,
                    user_id=booking.user_id,
                    title="Loyalty Points Reversed",
                    message=(
                        f"Due to cancellation of booking #{booking.id}, "
                        f"{earn_txn.points} loyalty points have been deducted from your account."
                    ),
                    type="warning",
                )
    except Exception as e:
        print(f"[loyalty_reversal] Failed for booking {booking.id}: {e}")

    # ── Notifications ────────────────────────────────────────────────────
    listing_title = listing.title if listing else f"Booking #{booking_id}"
    refund_str = f"PKR {refund_amount:,.0f}" if refund_amount > 0 else "no refund"

    from datetime import date as _date

    cancellation_policy = listing.cancellation_policy if listing else "moderate"

    # Determine refund eligibility for response
    refund_eligible = False
    if booking.payment_status in ("paid", "refunded", "partially_refunded"):
        # Check if a refund was actually processed
        refund_record = db.query(Refund).filter(Refund.booking_id == booking_id).first()
        if refund_record and refund_record.amount_refunded > 0:
            refund_eligible = True

    # Guest notification
    create_notification(
        db,
        user_id=current_user.id,
        title="Booking Cancelled",
        message=(
            f"Your booking #{booking_id} for '{listing_title}' has been cancelled. "
            f"Refund of {refund_str} has been processed."
        ),
        type="warning",
        email_type="booking_cancelled",
        email_context={
            "booking_id":          booking_id,
            "listing_title":       listing_title,
            "check_in":            str(booking.check_in) if booking.check_in else "",
            "check_out":           str(booking.check_out) if booking.check_out else "",
            "total_price":         f"{booking.total_price:,.0f}",
            "refund_amount":       f"{refund_amount:,.0f}" if refund_amount > 0 else "0",
            "cancellation_policy": cancellation_policy,
            "cancellation_date":   str(_date.today()),
            "refund_eligible":     refund_eligible,   # NEW
        },
        background_tasks=background_tasks,
    )

    # Provider notification (in-app only – no email template for provider cancel)
    if listing:
        create_notification(
            db,
            user_id=listing.owner_id,
            title="Booking Cancelled by Guest",
            message=(
                f"Booking #{booking_id} for '{listing_title}' was cancelled by the guest. "
                f"Refund of {refund_str} issued to customer."
            ),
            type="warning",
        )

    booking.refund_eligible = refund_eligible
    return booking


@router.patch("/{booking_id}/modify", response_model=BookingResponse)
async def modify_booking(
    booking_id: int,
    body: BookingModifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.user_id == current_user.id,
        )
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cannot modify a cancelled booking",
        )

    now = datetime.now(timezone.utc).date()
    unpaid = booking.payment_status == "unpaid"
    check_in_date = booking.check_in
    if hasattr(check_in_date, "date"):
        check_in_date = check_in_date.date()
    free_window = check_in_date > now

    if not unpaid and not free_window:
        raise HTTPException(
            status_code=403,
            detail=(
                "Booking can only be modified before payment "
                "or more than 24 hours before check-in"
            ),
        )

    if not any([body.check_in, body.check_out, body.room_type_id]):
        raise HTTPException(
            status_code=422,
            detail=(
                "At least one of check_in, check_out, room_type_id "
                "must be provided"
            ),
        )

    new_check_in = body.check_in or booking.check_in
    new_check_out = body.check_out or booking.check_out
    new_room_type_id = body.room_type_id or booking.room_type_id

    if hasattr(new_check_in, "date"):
        new_check_in = new_check_in.date()
    if hasattr(new_check_out, "date"):
        new_check_out = new_check_out.date()

    if new_check_in >= new_check_out:
        raise HTTPException(
            status_code=422,
            detail="check_out must be after check_in",
        )
    if new_check_in < now:
        raise HTTPException(
            status_code=422,
            detail="check_in cannot be in the past",
        )

    if new_room_type_id != booking.room_type_id:
        new_rt = (
            db.query(RoomType)
            .filter(
                RoomType.id == new_room_type_id,
                RoomType.listing_id == booking.listing_id,
            )
            .first()
        )
        if not new_rt:
            raise HTTPException(
                status_code=404,
                detail="Room type not found for this listing",
            )
    else:
        new_rt = (
            db.query(RoomType)
            .filter(
                RoomType.id == new_room_type_id,
            )
            .first()
        )
        if not new_rt:
            raise HTTPException(
                status_code=404,
                detail="Room type not found for this listing",
            )

    overlapping_count = (
        db.query(func.count(Booking.id))
        .filter(
            Booking.id != booking_id,
            Booking.room_type_id == new_room_type_id,
            Booking.status.in_(["active", "confirmed"]),
            Booking.check_in < new_check_out,
            Booking.check_out > new_check_in,
        )
        .scalar()
        or 0
    )
    available = (new_rt.total_rooms or 1) - overlapping_count
    if available < 1:
        raise HTTPException(
            status_code=400,
            detail="Room not available for the new dates",
        )

    nights = (new_check_out - new_check_in).days
    old_price = float(booking.total_price)
    new_price = (
        float(new_rt.price_per_night)
        * nights
        * getattr(booking, "room_quantity", 1)
    )
    price_diff = round(new_price - old_price, 2)

    booking.check_in = new_check_in
    booking.check_out = new_check_out
    booking.room_type_id = new_room_type_id
    booking.room_type_name = new_rt.name
    booking.total_price = new_price
    booking.price_adjustment = price_diff if price_diff != 0 else None
    db.commit()
    db.refresh(booking)

    listing = (
        db.query(Listing)
        .filter(Listing.id == booking.listing_id)
        .first()
    )
    provider_id = listing.owner_id if listing else None

    if provider_id:
        provider_msg = (
            f"Booking #{booking_id} has been modified by the guest. "
            f"New dates: {new_check_in} to {new_check_out}."
        )
        if price_diff > 0:
            provider_msg += f" Additional charge of PKR {price_diff} applies."
        elif price_diff < 0:
            provider_msg += f" Refund of PKR {abs(price_diff)} is due."

        create_notification(
            db,
            user_id=provider_id,
            title="Booking Modified",
            message=provider_msg,
            type="booking",
        )

    user_msg = (
        f"Your booking #{booking_id} has been successfully modified. "
        f"New dates: {new_check_in} to {new_check_out}."
    )
    if price_diff > 0:
        user_msg += f" An additional PKR {price_diff} will be charged."
    elif price_diff < 0:
        user_msg += f" A refund of PKR {abs(price_diff)} will be processed."
    else:
        user_msg += " Your total price remains unchanged."

    create_notification(
        db,
        user_id=current_user.id,
        title="Booking Modified",
        message=user_msg,
        type="booking",
    )

    return booking


@router.post("/{booking_id}/check-in", response_model=BookingResponse)
async def check_in_guest(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # A) FETCH BOOKING
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # B) VERIFY PROVIDER OWNERSHIP
    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only the listing provider can perform check-in",
        )

    # C) VALIDATE STATE
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cannot check in a cancelled booking",
        )
    if booking.checked_in_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Guest is already checked in",
        )

    # D) APPLY CHECK-IN
    from datetime import datetime, timezone

    booking.checked_in_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)

    # E) NOTIFY GUEST
    guest_msg = (
        f"You have been checked in to your booking #{booking_id}. "
        f"Welcome! Check-in time: {booking.checked_in_at.strftime('%Y-%m-%d %H:%M')} UTC"
    )
    create_notification(
        db,
        user_id=booking.user_id,
        title="Checked In",
        message=guest_msg,
        type="booking",
    )

    # F) RETURN booking
    return booking


@router.post("/{booking_id}/check-out", response_model=BookingResponse)
async def check_out_guest(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # A) FETCH BOOKING
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # B) VERIFY PROVIDER OWNERSHIP
    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only the listing provider can perform check-out",
        )

    # C) VALIDATE STATE
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Cannot check out a cancelled booking",
        )
    if booking.checked_in_at is None:
        raise HTTPException(
            status_code=400,
            detail="Guest has not checked in yet",
        )
    if booking.checked_out_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Guest is already checked out",
        )

    # D) APPLY CHECK-OUT
    from datetime import datetime, timezone

    booking.checked_out_at = datetime.now(timezone.utc)
    booking.status = "completed"
    db.commit()
    db.refresh(booking)

    # E) NOTIFY GUEST
    guest_msg = (
        f"You have been checked out from booking #{booking_id}. "
        f"Thank you for staying with us! "
        f"Check-out time: {booking.checked_out_at.strftime('%Y-%m-%d %H:%M')} UTC"
    )
    create_notification(
        db,
        user_id=booking.user_id,
        title="Checked Out",
        message=guest_msg,
        type="booking",
    )

    # F) RETURN booking
    return booking


@router.get("/{booking_id}/invoice", response_model=InvoiceResponse)
async def get_invoice(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # A) FETCH AND AUTHORIZE
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    provider_id_field = listing.owner_id
    if (
        booking.user_id != current_user.id
        and provider_id_field != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    # B) FETCH RELATED DATA
    from app.models.user import User as _User

    guest = db.query(_User).filter(_User.id == booking.user_id).first()
    provider = db.query(_User).filter(_User.id == provider_id_field).first()

    room_type_name = None
    if getattr(booking, "room_type_id", None):
        from app.models.room_type import RoomType

        rt = db.query(RoomType).filter(RoomType.id == booking.room_type_id).first()
        room_type_name = rt.name if rt else None

    from app.models.booking_room import BookingRoom

    room_sel_rows = (
        db.query(BookingRoom)
        .filter(BookingRoom.booking_id == booking.id)
        .all()
    )

    # C) CALCULATE TAX ON THE FLY
    subtotal = float(booking.total_price)
    gst_amount = round(subtotal * 0.17, 2)
    service_fee = round(subtotal * 0.05, 2)
    grand_total = round(subtotal + gst_amount + service_fee, 2)

    # D) BUILD ROOM SELECTIONS LIST
    nights = (
        (booking.check_out - booking.check_in).days
        if booking.check_in and booking.check_out
        else 1
    )
    room_selections_data = []

    if room_sel_rows:
        from app.models.room_type import RoomType as _RoomType

        for br in room_sel_rows:
            rt2 = db.query(_RoomType).filter(_RoomType.id == br.room_type_id).first()
            room_selections_data.append(
                {
                    "room_type_name": rt2.name if rt2 else f"Room #{br.room_type_id}",
                    "quantity": br.quantity,
                    "unit_price": float(br.unit_price),
                    "subtotal": float(br.unit_price) * br.quantity * nights,
                }
            )

    # E) BUILD AND RETURN InvoiceResponse
    invoice_number = f"INV-{booking.created_at.strftime('%Y')}-{booking.id:06d}"

    def user_display_name(u):
        if not u:
            return ""
        return (
            getattr(u, "full_name", None)
            or getattr(u, "name", None)
            or getattr(u, "username", None)
            or getattr(u, "email", "")
        )

    check_in_str = (
        booking.check_in.isoformat()
        if hasattr(booking.check_in, "isoformat")
        else str(booking.check_in)
    )
    check_out_str = (
        booking.check_out.isoformat()
        if hasattr(booking.check_out, "isoformat")
        else str(booking.check_out)
    )

    return InvoiceResponse(
        invoice_number=invoice_number,
        booking_id=booking.id,
        booking_date=booking.created_at.strftime("%Y-%m-%d"),
        guest_name=user_display_name(guest),
        guest_email=guest.email if guest else "",
        provider_name=user_display_name(provider),
        provider_email=provider.email if provider else "",
        provider_tax_id=getattr(provider, "tax_id", None) if provider else None,
        listing_name=listing.title,
        listing_location=getattr(listing, "location", ""),
        check_in=check_in_str,
        check_out=check_out_str,
        nights=nights,
        room_type_name=room_type_name,
        room_quantity=getattr(booking, "room_quantity", 1),
        subtotal=subtotal,
        gst_amount=gst_amount,
        service_fee=service_fee,
        grand_total=grand_total,
        room_selections=room_selections_data,
    )


@router.post("/admin/auto-checkout", response_model=dict)
async def trigger_auto_checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provider-callable endpoint to sweep overdue check-outs."""
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(status_code=403, detail="Providers only")
    count = auto_checkout_overdue(db)
    return {"auto_checked_out": count}

