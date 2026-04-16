import math
from datetime import date as date_type
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.coupon_helpers import record_coupon_use, validate_coupon_logic
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.coupon import Coupon
from app.models.listing import Listing
from app.models.room_type import RoomType
from app.models.user import User
from app.utils.notify import create_notification

router = APIRouter(
    prefix="/group-bookings",
    tags=["Group Bookings"],
)

GROUP_DISCOUNTS = {
    5: 5,
    10: 10,
    15: 15,
    20: 20,
    30: 25,
    50: 30,
}


def get_group_discount_rate(group_size: int) -> int:
    rate = 0
    for min_size, discount in sorted(GROUP_DISCOUNTS.items()):
        if group_size >= min_size:
            rate = discount
    return rate


class GroupBookingRequest(BaseModel):
    listing_id: int
    room_type_id: int | None = None
    check_in: str
    check_out: str | None = None
    group_size: int
    group_lead_name: str | None = None
    special_requirements: str | None = None
    apply_group_discount: bool = True
    coupon_code: str | None = None


PER_PERSON_TYPES = frozenset({
    "medical",
})

SINGLE_DATE_TYPES = frozenset({
    "tour",
    "activity",
    "horse_riding",
    "guide",
})

PER_ROOM_TYPES = frozenset({"hotel", "camping"})

def _parse_dates(
    check_in: str,
    check_out: str | None,
    *,
    service_type: str,
) -> tuple[date_type, date_type, int]:
    try:
        ci = datetime.strptime(check_in, "%Y-%m-%d").date()
    except ValueError as e:
        raise HTTPException(400, "Invalid date format") from e

    # Single-date services (tour/activity/horse_riding/guide):
    # - check_out may be omitted
    # - if provided, it must match check_in
    # - nights is always forced to 1
    if service_type in SINGLE_DATE_TYPES:
        if check_out:
            try:
                co = datetime.strptime(check_out, "%Y-%m-%d").date()
            except ValueError as e:
                raise HTTPException(400, "Invalid date format") from e
            if co != ci:
                raise HTTPException(400, "For tours, check-out must equal check-in.")
        else:
            co = ci
        return ci, co, 1

    if not check_out:
        raise HTTPException(400, "Check-out is required")
    try:
        co = datetime.strptime(check_out, "%Y-%m-%d").date()
    except ValueError as e:
        raise HTTPException(400, "Invalid date format") from e
    if co <= ci:
        raise HTTPException(400, "Check-out must be after check-in")
    nights = max(1, (co - ci).days)
    return ci, co, nights


def _build_breakdown(
    service_type: str,
    price_unit: float,
    units_needed: int,
    nights: int,
    group_size: int,
    base_price: float,
    discount_rate: int,
    discount_amount: float,
    total_price: float,
    price_per_person: float,
    unit_label: str,
) -> list[str]:
    lines: list[str] = []
    if service_type in SINGLE_DATE_TYPES:
        lines.append(
            f"PKR {price_unit:,.0f}/person × "
            f"{group_size} people = "
            f"PKR {base_price:,.0f}"
        )
    elif service_type in PER_PERSON_TYPES:
        lines.append(
            f"PKR {price_unit:,.0f}/person × "
            f"{group_size} people × "
            f"{nights} night(s) = "
            f"PKR {base_price:,.0f}"
        )
    elif service_type in PER_ROOM_TYPES:
        lines.append(
            f"{units_needed} {unit_label}(s) needed "
            f"for {group_size} people"
        )
        lines.append(
            f"PKR {price_unit:,.0f}/{unit_label} × "
            f"{units_needed} × {nights} night(s) = "
            f"PKR {base_price:,.0f}"
        )
    else:
        lines.append(
            f"PKR {price_unit:,.0f} × "
            f"{nights} night(s) = "
            f"PKR {base_price:,.0f}"
        )

    if discount_rate > 0:
        lines.append(
            f"Group discount {discount_rate}% = "
            f"-PKR {discount_amount:,.0f}"
        )
    lines.append(f"Total: PKR {total_price:,.0f}")
    lines.append(
        f"Per person: PKR {price_per_person:,.0f}"
    )
    return lines


def calculate_price_for_group(
    listing: Listing,
    room: RoomType | None,
    group_size: int,
    nights: int,
    apply_discount: bool,
) -> dict:
    service_type = (listing.service_type or "").strip().lower()
    price_unit = float(listing.price_per_night or 0)
    if room:
        price_unit = float(room.price_per_night)

    units_needed = 1
    price_label = "night"
    unit_label = "room"
    room_capacity_val: int | None = None
    base_price = 0.0

    # Single-date group pricing:
    # listing.price_per_night is interpreted as per-person price here.
    # We do NOT multiply by nights for tours/activities.
    if service_type in SINGLE_DATE_TYPES:
        nights = 1
        units_needed = group_size
        price_label = "person"
        unit_label = "person"
        base_price = price_unit * group_size

    # Other per-person services that still depend on nights.
    elif service_type in PER_PERSON_TYPES:
        units_needed = group_size
        price_label = "person"
        unit_label = "person"
        base_price = price_unit * group_size * nights

    # Hotel/camping pricing remains room-based and night-based.
    elif service_type in PER_ROOM_TYPES:
        room_capacity = 2
        if room is not None and getattr(room, "capacity", None) is not None:
            room_capacity = max(1, int(room.capacity))
        room_capacity_val = room_capacity
        rooms_needed = math.ceil(group_size / room_capacity)
        units_needed = rooms_needed
        price_label = "room/night"
        unit_label = "room"
        base_price = price_unit * rooms_needed * nights

    # Transport/general fallback pricing remains unchanged.
    else:
        units_needed = 1
        price_label = "trip"
        unit_label = "vehicle"
        base_price = price_unit * nights

    discount_rate = 0
    if apply_discount:
        discount_rate = get_group_discount_rate(group_size)

    discount_amount = round(
        base_price * discount_rate / 100, 2
    )
    total_price = round(base_price - discount_amount, 2)
    price_per_person = round(
        total_price / max(1, group_size), 2
    )

    breakdown_text = _build_breakdown(
        service_type,
        price_unit,
        units_needed,
        nights,
        group_size,
        base_price,
        discount_rate,
        discount_amount,
        total_price,
        price_per_person,
        unit_label,
    )

    return {
        "service_type": service_type,
        "price_unit": price_unit,
        "price_label": price_label,
        "unit_label": unit_label,
        "units_needed": units_needed,
        "nights": nights,
        "group_size": group_size,
        "base_price": base_price,
        "discount_rate": discount_rate,
        "discount_amount": discount_amount,
        "total_price": total_price,
        "price_per_person": price_per_person,
        "room_capacity": room_capacity_val
        if service_type in PER_ROOM_TYPES
        else None,
        "breakdown_text": breakdown_text,
    }


@router.get("/discount-rates")
def get_discount_rates():
    tiers = []
    for size, discount in sorted(GROUP_DISCOUNTS.items()):
        tiers.append({
            "min_persons": size,
            "discount_percent": discount,
            "label": f"{size}+ people = {discount}% off",
        })
    return tiers


@router.post("/calculate")
def calculate_group_price(
    body: GroupBookingRequest,
    db: Session = Depends(get_db),
):
    """Return a pricing preview for group bookings."""
    listing = db.query(Listing).filter(
        Listing.id == body.listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    if (listing.service_type or "").strip().lower() == "restaurant":
        raise HTTPException(
            400,
            "Group booking is not available for restaurants",
        )
    service_type = (listing.service_type or "").strip().lower()

    room = None
    if body.room_type_id:
        room = (
            db.query(RoomType)
            .filter(
                RoomType.id == body.room_type_id,
                RoomType.listing_id == body.listing_id,
            )
            .first()
        )

    _, _, nights = _parse_dates(
        body.check_in,
        body.check_out,
        service_type=service_type,
    )

    result = calculate_price_for_group(
        listing,
        room,
        body.group_size,
        nights,
        body.apply_group_discount,
    )

    return {
        "listing_title": listing.title,
        "service_type": listing.service_type,
        "price_per_night": result["price_unit"],
        "price_label": result["price_label"],
        "unit_label": result["unit_label"],
        "units_needed": result["units_needed"],
        "nights": result["nights"],
        "check_in": body.check_in,
        "check_out": (
            body.check_in if service_type in SINGLE_DATE_TYPES else body.check_out
        ),
        "group_size": body.group_size,
        "base_price": result["base_price"],
        "discount_rate": result["discount_rate"],
        "discount_amount": result["discount_amount"],
        "total_price": result["total_price"],
        "price_per_person": result["price_per_person"],
        "room_capacity": result["room_capacity"],
        "breakdown_text": result["breakdown_text"],
    }


@router.post("/book")
def create_group_booking(
    body: GroupBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create and persist a group booking."""
    listing = db.query(Listing).filter(
        Listing.id == body.listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    if listing.owner_id == current_user.id:
        raise HTTPException(400, "Cannot book your own listing")

    if (listing.service_type or "").strip().lower() == "restaurant":
        raise HTTPException(
            400,
            "Group booking is not available for restaurants",
        )
    service_type = (listing.service_type or "").strip().lower()

    room = None
    if body.room_type_id:
        room = (
            db.query(RoomType)
            .filter(
                RoomType.id == body.room_type_id,
                RoomType.listing_id == body.listing_id,
            )
            .first()
        )

    ci, co, nights = _parse_dates(
        body.check_in,
        body.check_out,
        service_type=service_type,
    )

    today = date_type.today()
    if ci < today:
        raise HTTPException(400, "Check-in date cannot be in the past")

    # ── Capacity check for single-date services (tours/activities) ─────────
    if service_type in SINGLE_DATE_TYPES:
        from app.models.tour_date_capacity import TourDateCapacity
        from sqlalchemy import func

        check_date = ci  # check-in date

        # Get custom capacity override if exists
        custom_capacity = (
            db.query(TourDateCapacity)
            .filter(
                TourDateCapacity.listing_id == listing.id,
                TourDateCapacity.tour_date == check_date,
            )
            .first()
        )

        max_capacity = (
            custom_capacity.capacity
            if custom_capacity is not None
            else listing.max_capacity_per_day
        )

        # If capacity is not set (None), treat as unlimited (skip check)
        if max_capacity is not None:
            # Count existing active/confirmed bookings for this date
            booked_count = (
                db.query(func.count(Booking.id))
                .filter(
                    Booking.listing_id == listing.id,
                    Booking.status.in_(["active", "confirmed"]),
                    Booking.check_in == check_date,
                )
                .scalar() or 0
            )

            # Calculate available spots
            available_spots = max_capacity - booked_count

            if body.group_size > available_spots:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Not enough spots available. "
                        f"Requested: {body.group_size}, "
                        f"Available: {available_spots}."
                    ),
                )

    # Conflict check for single-date services only needs same-day collisions.
    if service_type in SINGLE_DATE_TYPES:
        overlapping = (
            db.query(Booking)
            .filter(
                Booking.listing_id == body.listing_id,
                Booking.status == "active",
                Booking.check_in == ci,
            )
            .first()
        )
    else:
        overlapping = (
            db.query(Booking)
            .filter(
                Booking.listing_id == body.listing_id,
                Booking.status == "active",
                Booking.check_in < co,
                Booking.check_out > ci,
            )
            .first()
        )
    if overlapping:
        raise HTTPException(
            400,
            "Booking conflict: dates overlap with existing booking",
        )

    calc = calculate_price_for_group(
        listing,
        room,
        body.group_size,
        nights,
        body.apply_group_discount,
    )

    discount_rate = calc["discount_rate"]
    group_discount_amount = calc["discount_amount"]
    total_price = calc["total_price"]
    price_per_person_val = calc["price_per_person"]

    room_type_id = room.id if room else None
    room_name = room.name if room else None

    coupon_obj = None
    coupon_discount = 0.0
    if body.coupon_code and body.coupon_code.strip():
        code_norm = body.coupon_code.upper().strip()
        coupon_obj = db.query(Coupon).filter(Coupon.code == code_norm).first()
        if not coupon_obj:
            raise HTTPException(400, "Invalid coupon code")
        if body.apply_group_discount and discount_rate > 0:
            raw_stack = getattr(coupon_obj, "is_stackable", True)
            stackable = bool(raw_stack) if raw_stack is not None else True
            if not stackable:
                raise HTTPException(
                    400,
                    "This coupon cannot be combined with group discount",
                )
        ok, msg, coupon_discount = validate_coupon_logic(
            coupon_obj,
            current_user.id,
            total_price,
            body.listing_id,
            db,
            listing_owner_id=listing.owner_id,
        )
        if not ok:
            raise HTTPException(400, msg)
        total_price = max(0, round(total_price - coupon_discount, 2))
        price_per_person_val = round(
            total_price / max(1, body.group_size), 2
        )

    booking = Booking(
        listing_id=body.listing_id,
        user_id=current_user.id,
        check_in=ci,
        check_out=ci if service_type in SINGLE_DATE_TYPES else co,
        total_price=total_price,
        status="active",
        room_type_id=room_type_id,
        room_type_name=room_name,
        group_size=body.group_size,
        is_group_booking=True,
        group_lead_name=body.group_lead_name or current_user.full_name,
        group_discount_applied=group_discount_amount,
        price_per_person=price_per_person_val,
        special_requirements=body.special_requirements,
    )
    db.add(booking)
    db.flush()
    if coupon_obj:
        record_coupon_use(
            db,
            coupon_obj,
            current_user.id,
            booking.id,
            coupon_discount,
        )
    db.commit()
    db.refresh(booking)

    group_text = (
        f"Group of {body.group_size}"
        if body.group_size > 1 else "1 person"
    )
    try:
        create_notification(
            db,
            user_id=current_user.id,
            title="Group Booking Confirmed! 👥",
            message=(
                f"{group_text} booked '{listing.title}' from "
                f"{ci.isoformat()} to "
                f"{(ci if service_type in SINGLE_DATE_TYPES else co).isoformat()}. "
                f"Total: PKR {total_price:,.0f}"
                + (
                    f" (saved PKR {group_discount_amount:,.0f}!)"
                    if group_discount_amount > 0
                    else ""
                )
            ),
            type="success",
        )
        create_notification(
            db,
            user_id=listing.owner_id,
            title="New Group Booking! 👥",
            message=(
                f"{current_user.full_name} booked for {group_text}. "
                f"Revenue: PKR {total_price:,.0f}"
            ),
            type="booking",
        )
    except Exception:
        pass

    return {
        "id": booking.id,
        "listing_title": listing.title,
        "service_type": listing.service_type,
        "check_in": booking.check_in.isoformat() if booking.check_in else body.check_in,
        "check_out": booking.check_out.isoformat() if booking.check_out else body.check_in,
        "group_size": body.group_size,
        "nights": calc["nights"],
        "units_needed": calc["units_needed"],
        "unit_label": calc["unit_label"],
        "total_price": total_price,
        "discount_applied": group_discount_amount,
        "price_per_person": price_per_person_val,
        "discount_rate": discount_rate,
        "breakdown_text": calc["breakdown_text"],
        "status": "confirmed",
        "message": "Group booking confirmed!",
    }
