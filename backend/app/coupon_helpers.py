"""Shared coupon validation and discount calculation."""

from datetime import date

from sqlalchemy.orm import Session

from app.models.coupon import Coupon, CouponUsage
from app.models.listing import Listing


def calculate_discount(coupon: Coupon, amount: float) -> float:
    if coupon.discount_type == "percentage":
        discount = amount * (coupon.discount_value / 100)
        if coupon.max_discount_amount:
            discount = min(discount, coupon.max_discount_amount)
    else:
        discount = min(coupon.discount_value, amount)
    return round(discount, 2)


def validate_coupon_logic(
    coupon: Coupon,
    user_id: int,
    booking_amount: float,
    listing_id: int | None,
    db: Session,
    *,
    listing_owner_id: int | None = None,
) -> tuple[bool, str, float]:
    today = date.today().isoformat()

    if not coupon.is_active:
        return False, "Coupon is no longer active", 0

    if coupon.valid_from and today < coupon.valid_from:
        return False, f"Coupon valid from {coupon.valid_from}", 0

    if coupon.valid_until and today > coupon.valid_until:
        return False, "Coupon has expired", 0

    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        return False, "Coupon usage limit reached", 0

    min_amt = coupon.min_booking_amount or 0
    if booking_amount < min_amt:
        return (
            False,
            f"Minimum booking amount is PKR {min_amt:,.0f}",
            0,
        )

    effective_owner_id = listing_owner_id
    if effective_owner_id is None and listing_id is not None:
        lst = db.query(Listing).filter(Listing.id == listing_id).first()
        effective_owner_id = lst.owner_id if lst else None

    scope = getattr(coupon, "scope", None) or "provider"
    provider_id = getattr(coupon, "provider_id", None)

    if scope == "all":
        pass

    elif scope == "listing" or coupon.listing_id:
        if coupon.listing_id:
            if listing_id is None or coupon.listing_id != listing_id:
                return False, "Coupon not valid for this service", 0

    elif scope == "provider":
        if provider_id and effective_owner_id is not None:
            if provider_id != effective_owner_id:
                return (
                    False,
                    "Coupon not valid for this provider's services",
                    0,
                )

    per_user = coupon.max_uses_per_user
    if per_user is None:
        per_user = 1
    if per_user > 0:
        user_usage = (
            db.query(CouponUsage)
            .filter(
                CouponUsage.coupon_id == coupon.id,
                CouponUsage.user_id == user_id,
            )
            .count()
        )

        if user_usage >= per_user:
            return False, "You have already used this coupon", 0

    discount = calculate_discount(coupon, booking_amount)
    return True, "Coupon applied successfully!", discount


def record_coupon_use(
    db: Session,
    coupon: Coupon,
    user_id: int,
    booking_id: int | None,
    discount_applied: float,
) -> None:
    usage = CouponUsage(
        coupon_id=coupon.id,
        user_id=user_id,
        booking_id=booking_id,
        discount_applied=discount_applied,
    )
    db.add(usage)
    coupon.used_count += 1
