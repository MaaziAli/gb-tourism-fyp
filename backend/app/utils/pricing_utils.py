from __future__ import annotations

from datetime import date
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models.discount_rule import DiscountRule


def apply_discount_rules(
    listing_id: int,
    base_price: float,
    check_in: date,
    check_out: date,
    booking_date: date,
    db: Session,
) -> Tuple[float, float, Optional[str]]:
    """
    Apply the best (highest) discount rule for this listing and stay.

    Rules are evaluated AFTER seasonal pricing and are not stacked:
    the single rule with the highest discount_percent wins.

    Returns: (final_price, best_discount_percent, best_label)
    """
    if base_price <= 0:
        return base_price, 0.0, None

    nights = max(1, (check_out - check_in).days or 1)
    days_until_checkin = (check_in - booking_date).days

    rules = (
        db.query(DiscountRule)
        .filter(
            DiscountRule.listing_id == listing_id,
            DiscountRule.is_active.is_(True),
        )
        .all()
    )
    if not rules:
        return base_price, 0.0, None

    best_discount = 0.0
    best_label: Optional[str] = None

    for rule in rules:
        matched = False

        if rule.rule_type == "length_of_stay":
            if rule.min_nights is not None and nights < rule.min_nights:
                matched = False
            else:
                upper_ok = (
                    rule.max_nights is None or nights <= rule.max_nights
                )
                matched = upper_ok

        elif rule.rule_type == "last_minute":
            if rule.book_within_days is not None:
                matched = 0 <= days_until_checkin <= rule.book_within_days

        elif rule.rule_type == "advance_booking":
            if rule.book_days_ahead is not None:
                matched = days_until_checkin >= rule.book_days_ahead

        if not matched:
            continue

        try:
            pct = float(rule.discount_percent or 0)
        except (TypeError, ValueError):
            continue

        if pct > best_discount:
            best_discount = pct
            best_label = rule.label

    if best_discount <= 0:
        return base_price, 0.0, None

    final_price = round(base_price * (1 - best_discount / 100.0), 2)
    return final_price, best_discount, best_label

