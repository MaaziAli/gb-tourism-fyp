from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction

# ══════════════════════════════════════
# DARAZ-STYLE POINTS CONFIGURATION
# ══════════════════════════════════════
POINTS_PER_PKR = 10
# PKR 1 = 10 points

POINTS_VALUE = 1 / 1000
# 1000 points = PKR 1

TIER_THRESHOLDS = {
    "bronze": 0,
    "silver": 50000,
    "gold": 200000,
    "platinum": 500000,
}

TIER_BONUS_RATES = {
    "bronze": 1.0,
    "silver": 1.05,
    "gold": 1.10,
    "platinum": 1.20,
}

TIER_EMOJI = {
    "bronze": "🥉",
    "silver": "🥈",
    "gold": "🥇",
    "platinum": "💎",
}

BONUS_POINTS = {
    "first_booking": 5000,
    "review": 2000,
    "restaurant": 1000,
}


def get_or_create_account(db: Session, user_id: int) -> LoyaltyAccount:
    account = (
        db.query(LoyaltyAccount)
        .filter(LoyaltyAccount.user_id == user_id)
        .first()
    )
    if not account:
        account = LoyaltyAccount(
            user_id=user_id,
            total_points=0,
            lifetime_points=0,
            tier="bronze",
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    return account


def get_tier(lifetime_points: int) -> str:
    tier = "bronze"
    for t, threshold in sorted(
        TIER_THRESHOLDS.items(),
        key=lambda x: x[1],
    ):
        if lifetime_points >= threshold:
            tier = t
    return tier


def calculate_points_for_amount(amount: float, tier: str) -> int:
    base_points = int(amount * POINTS_PER_PKR)
    multiplier = TIER_BONUS_RATES.get(tier, 1.0)
    return int(base_points * multiplier)


def points_to_pkr(points: int) -> float:
    return round(points * POINTS_VALUE, 2)


def pkr_to_points(pkr: float) -> int:
    if pkr <= 0:
        return 0
    return int(pkr / POINTS_VALUE)


def format_points(points: int) -> str:
    if points >= 1000000:
        return f"{points / 1000000:.1f}M"
    if points >= 1000:
        return f"{points / 1000:.1f}K"
    return str(points)


def add_points(
    db: Session,
    user_id: int,
    points: int,
    transaction_type: str,
    description: str,
    reference_id: int | None = None,
) -> Optional[dict]:
    if points <= 0:
        return None

    account = get_or_create_account(db, user_id)
    old_tier = account.tier

    account.total_points += points
    account.lifetime_points += points
    account.last_activity = datetime.utcnow()

    new_tier = get_tier(account.lifetime_points)
    account.tier = new_tier
    tier_upgraded = new_tier != old_tier

    txn = LoyaltyTransaction(
        user_id=user_id,
        points=points,
        transaction_type=transaction_type,
        description=description,
        reference_id=reference_id,
        balance_after=account.total_points,
    )
    db.add(txn)
    db.commit()
    db.refresh(account)

    if tier_upgraded:
        try:
            from app.utils.notify import create_notification

            emoji = TIER_EMOJI.get(new_tier, "⭐")
            create_notification(
                db,
                user_id=user_id,
                title=f"Tier Upgrade! {emoji} {new_tier.title()}",
                message=(
                    f"🎉 You've reached {emoji} {new_tier.title()} "
                    f"tier! Enjoy more bonus points on every booking."
                ),
                type="success",
            )
        except Exception:
            pass

    return {
        "points_earned": points,
        "total_points": account.total_points,
        "tier": account.tier,
        "tier_upgraded": tier_upgraded,
        "new_tier": new_tier if tier_upgraded else None,
        "pkr_value": points_to_pkr(points),
    }


def redeem_points(
    db: Session,
    user_id: int,
    points: int,
    description: str,
    reference_id: int | None = None,
) -> dict:
    account = get_or_create_account(db, user_id)

    if account.total_points < points:
        return {
            "success": False,
            "message": (
                f"Not enough points. You have {account.total_points:,} points."
            ),
        }

    pkr_value = points_to_pkr(points)
    account.total_points -= points
    account.last_activity = datetime.utcnow()

    txn = LoyaltyTransaction(
        user_id=user_id,
        points=-points,
        transaction_type="redeem",
        description=description,
        reference_id=reference_id,
        balance_after=account.total_points,
    )
    db.add(txn)
    db.commit()
    db.refresh(account)

    return {
        "success": True,
        "points_used": points,
        "pkr_value": pkr_value,
        "remaining_points": account.total_points,
        "message": (
            f"Redeemed {points:,} points for PKR {pkr_value:,.2f} discount!"
        ),
    }


def check_first_booking(db: Session, user_id: int) -> bool:
    from app.models.booking import Booking

    count = (
        db.query(Booking)
        .filter(
            Booking.user_id == user_id,
            Booking.status != "cancelled",
        )
        .count()
    )
    return count == 1
