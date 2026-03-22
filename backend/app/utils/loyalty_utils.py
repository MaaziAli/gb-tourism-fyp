import math
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction

# PKR 10 = 1 point
POINTS_PER_PKR = 0.1
# 100 points = PKR 25 → 1 point = PKR 0.25
POINTS_VALUE_PKR = 0.25

TIER_THRESHOLDS = {
    "bronze": 0,
    "silver": 500,
    "gold": 2000,
    "platinum": 5000,
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
    "first_booking": 200,
    "review": 50,
    "restaurant": 30,
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
    return round(points * POINTS_VALUE_PKR, 2)


def pkr_to_points_needed(pkr: float) -> int:
    if pkr <= 0:
        return 0
    return max(1, int(math.ceil(pkr / POINTS_VALUE_PKR)))


def add_points(
    db: Session,
    user_id: int,
    points: int,
    transaction_type: str,
    description: str,
    reference_id: int | None = None,
) -> Optional[LoyaltyAccount]:
    if points <= 0:
        return None

    account = get_or_create_account(db, user_id)
    old_tier = account.tier

    account.total_points += points
    account.lifetime_points += points
    account.last_activity = datetime.utcnow()

    new_tier = get_tier(account.lifetime_points)
    account.tier = new_tier

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

    if new_tier != old_tier:
        try:
            from app.utils.notify import create_notification

            emoji = TIER_EMOJI.get(new_tier, "⭐")
            create_notification(
                db,
                user_id=user_id,
                title=f"Tier Upgrade! {emoji} {new_tier.title()}",
                message=(
                    f"Congratulations! You've reached {emoji} "
                    f"{new_tier.title()} tier. Enjoy better rewards!"
                ),
                type="success",
            )
        except Exception:
            pass

    return account


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
                f"Insufficient points. You have {account.total_points} points."
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
            f"Redeemed {points} points for PKR {pkr_value:,.0f} discount!"
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
