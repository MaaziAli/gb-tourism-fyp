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
    check_out: str
    group_size: int
    group_lead_name: str | None = None
    special_requirements: str | None = None
    apply_group_discount: bool = True
    coupon_code: str | None = None


def _parse_dates(check_in: str, check_out: str) -> tuple[date_type, date_type, int]:
    try:
        ci = datetime.strptime(check_in, "%Y-%m-%d").date()
        co = datetime.strptime(check_out, "%Y-%m-%d").date()
    except ValueError as e:
        raise HTTPException(400, "Invalid date format") from e
    if co <= ci:
        raise HTTPException(400, "Check-out must be after check-in")
    nights = max(1, (co - ci).days)
    return ci, co, nights


def _resolve_price_and_room(
    db: Session,
    listing: Listing,
    listing_id: int,
    room_type_id: int | None,
) -> tuple[float, int | None, str | None]:
    price_per_night = listing.price_per_night
    room_name = None
    resolved_room_id = room_type_id
    if room_type_id:
        room = (
            db.query(RoomType)
            .filter(
                RoomType.id == room_type_id,
                RoomType.listing_id == listing_id,
            )
            .first()
        )
        if not room:
            raise HTTPException(404, "Room type not found")
        price_per_night = room.price_per_night
        room_name = room.name
    return price_per_night, resolved_room_id, room_name


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
    listing = db.query(Listing).filter(
        Listing.id == body.listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    price_per_night, _, _ = _resolve_price_and_room(
        db, listing, body.listing_id, body.room_type_id
    )

    _, _, nights = _parse_dates(body.check_in, body.check_out)

    base_price = price_per_night * nights
    discount_rate = (
        get_group_discount_rate(body.group_size)
        if body.apply_group_discount
        else 0
    )
    discount_amount = round(base_price * discount_rate / 100, 2)
    discounted_price = base_price - discount_amount

    price_per_person = round(
        discounted_price / body.group_size, 2
    ) if body.group_size > 0 else 0.0

    service_type = listing.service_type or ""
    price_unit = "per night"
    if service_type in (
        "tour", "activity", "horse_riding",
        "guide", "boat_trip",
    ):
        price_unit = "per person"

    return {
        "listing_title": listing.title,
        "service_type": service_type,
        "price_per_night": price_per_night,
        "nights": nights,
        "check_in": body.check_in,
        "check_out": body.check_out,
        "group_size": body.group_size,
        "base_price": base_price,
        "discount_rate": discount_rate,
        "discount_amount": discount_amount,
        "total_price": discounted_price,
        "price_per_person": price_per_person,
        "price_unit": price_unit,
        "breakdown": {
            "base": (
                f"PKR {price_per_night:,.0f} × {nights} night(s)"
            ),
            "subtotal": f"PKR {base_price:,.0f}",
            "group_discount": (
                f"-{discount_rate}% = PKR -{discount_amount:,.0f}"
                if discount_rate > 0
                else None
            ),
            "total": f"PKR {discounted_price:,.0f}",
            "per_person": f"PKR {price_per_person:,.0f} per person",
        },
    }


@router.post("/book")
def create_group_booking(
    body: GroupBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == body.listing_id
    ).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    if listing.owner_id == current_user.id:
        raise HTTPException(400, "Cannot book your own listing")

    ci, co, nights = _parse_dates(body.check_in, body.check_out)

    today = date_type.today()
    if ci < today:
        raise HTTPException(400, "Check-in date cannot be in the past")

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

    price_per_night, room_type_id, room_name = _resolve_price_and_room(
        db, listing, body.listing_id, body.room_type_id
    )

    base_price = price_per_night * nights
    discount_rate = (
        get_group_discount_rate(body.group_size)
        if body.apply_group_discount
        else 0
    )
    group_discount_amount = round(base_price * discount_rate / 100, 2)
    total_price = base_price - group_discount_amount
    price_per_person_val = round(
        total_price / body.group_size, 2
    ) if body.group_size > 0 else 0.0

    coupon_obj = None
    coupon_discount = 0.0
    if body.coupon_code and body.coupon_code.strip():
        code_norm = body.coupon_code.upper().strip()
        coupon_obj = db.query(Coupon).filter(Coupon.code == code_norm).first()
        if not coupon_obj:
            raise HTTPException(400, "Invalid coupon code")
        ok, msg, coupon_discount = validate_coupon_logic(
            coupon_obj,
            current_user.id,
            total_price,
            body.listing_id,
            db,
        )
        if not ok:
            raise HTTPException(400, msg)
        total_price = max(0, round(total_price - coupon_discount, 2))
        price_per_person_val = round(
            total_price / body.group_size, 2
        ) if body.group_size > 0 else 0.0

    booking = Booking(
        listing_id=body.listing_id,
        user_id=current_user.id,
        check_in=ci,
        check_out=co,
        total_price=total_price,
        status="active",
        room_type_id=room_type_id,
        room_type_name=room_name,
        group_size=body.group_size,
        is_group_booking=body.group_size > 1,
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
        f"Group of {body.group_size} people"
        if body.group_size > 1
        else "1 person"
    )
    create_notification(
        db,
        user_id=current_user.id,
        title="Group Booking Confirmed! 👥",
        message=(
            f"{group_text} booked '{listing.title}' from "
            f"{body.check_in} to {body.check_out}. "
            f"Total: PKR {total_price:,.0f}"
            + (
                f" (saved PKR {group_discount_amount:,.0f} on group rate!)"
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
            f"{current_user.full_name} booked for {group_text} from "
            f"{body.check_in} to {body.check_out}. "
            f"Revenue: PKR {total_price:,.0f}"
        ),
        type="booking",
    )

    return {
        "id": booking.id,
        "listing_title": listing.title,
        "check_in": booking.check_in.isoformat() if booking.check_in else body.check_in,
        "check_out": booking.check_out.isoformat() if booking.check_out else body.check_out,
        "group_size": booking.group_size,
        "total_price": booking.total_price,
        "discount_applied": group_discount_amount,
        "price_per_person": price_per_person_val,
        "discount_rate": discount_rate,
        "status": "confirmed",
        "message": "Group booking confirmed!",
    }
