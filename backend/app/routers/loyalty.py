from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.loyalty import LoyaltyTransaction
from app.utils.loyalty_utils import (
    TIER_BONUS_RATES,
    TIER_EMOJI,
    TIER_THRESHOLDS,
    get_or_create_account,
    pkr_to_points_needed,
    points_to_pkr,
)

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])


class RedeemRequest(BaseModel):
    points: int
    booking_amount: float


@router.get("/my-account")
def get_my_loyalty(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = get_or_create_account(db, current_user.id)

    tiers_list = ["bronze", "silver", "gold", "platinum"]
    tier = account.tier if account.tier in tiers_list else "bronze"
    next_tier: Optional[str] = None
    points_to_next: Optional[int] = None
    current_idx = tiers_list.index(tier)
    if current_idx < len(tiers_list) - 1:
        next_tier = tiers_list[current_idx + 1]
        threshold = TIER_THRESHOLDS[next_tier]
        points_to_next = max(0, threshold - account.lifetime_points)

    pkr_value = points_to_pkr(account.total_points)

    return {
        "total_points": account.total_points,
        "lifetime_points": account.lifetime_points,
        "tier": account.tier,
        "tier_emoji": TIER_EMOJI.get(account.tier, "🥉"),
        "tier_label": account.tier.title(),
        "next_tier": next_tier,
        "next_tier_emoji": TIER_EMOJI.get(next_tier, "")
        if next_tier
        else None,
        "points_to_next_tier": points_to_next,
        "pkr_value": pkr_value,
        "bonus_multiplier": TIER_BONUS_RATES.get(account.tier, 1.0),
        "tiers": [
            {
                "key": t,
                "label": t.title(),
                "emoji": TIER_EMOJI.get(t, ""),
                "threshold": TIER_THRESHOLDS.get(t, 0),
                "bonus": int((TIER_BONUS_RATES.get(t, 1.0) - 1) * 100),
                "bonus_percent": int(
                    (TIER_BONUS_RATES.get(t, 1.0) - 1) * 100
                ),
                "is_current": t == account.tier,
                "is_achieved": account.lifetime_points
                >= TIER_THRESHOLDS.get(t, 0),
            }
            for t in tiers_list
        ],
    }


@router.get("/transactions")
def get_transactions(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txns = (
        db.query(LoyaltyTransaction)
        .filter(LoyaltyTransaction.user_id == current_user.id)
        .order_by(LoyaltyTransaction.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": t.id,
            "points": t.points,
            "type": t.transaction_type,
            "description": t.description,
            "balance_after": t.balance_after,
            "created_at": t.created_at.isoformat(),
        }
        for t in txns
    ]


@router.post("/calculate-redeem")
def calculate_redeem(
    body: RedeemRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    account = get_or_create_account(db, current_user.id)

    if body.points <= 0:
        raise HTTPException(400, "Points must be positive")

    if body.points > account.total_points:
        raise HTTPException(
            400,
            f"Not enough points. You have {account.total_points} points.",
        )

    max_discount = body.booking_amount * 0.5
    discount = points_to_pkr(body.points)
    actual_discount = min(discount, max_discount)

    if actual_discount < discount:
        actual_points = pkr_to_points_needed(actual_discount)
    else:
        actual_points = body.points

    return {
        "points_requested": body.points,
        "points_to_use": actual_points,
        "discount_amount": actual_discount,
        "final_amount": max(0, body.booking_amount - actual_discount),
        "available_points": account.total_points,
        "remaining_after": account.total_points - actual_points,
        "max_redeemable": account.total_points,
        "max_discount_possible": points_to_pkr(account.total_points),
    }


@router.get("/tiers")
def get_tiers():
    tiers_list = ["bronze", "silver", "gold", "platinum"]
    benefits = {
        "bronze": [
            "Earn 1 point per PKR 10",
            "Redeem for PKR 25 per 100 pts",
            "Access to member deals",
        ],
        "silver": [
            "5% bonus points on bookings",
            "Early access to deals",
            "Priority support",
        ],
        "gold": [
            "10% bonus points on bookings",
            "Free room upgrade (when available)",
            "VIP customer support",
        ],
        "platinum": [
            "20% bonus points on bookings",
            "Complimentary services",
            "Dedicated account manager",
            "Exclusive platinum deals",
        ],
    }
    return [
        {
            "key": t,
            "label": t.title(),
            "emoji": TIER_EMOJI.get(t, ""),
            "threshold": TIER_THRESHOLDS.get(t, 0),
            "bonus_percent": int(
                (TIER_BONUS_RATES.get(t, 1.0) - 1) * 100
            ),
            "benefits": benefits.get(t, []),
        }
        for t in tiers_list
    ]
