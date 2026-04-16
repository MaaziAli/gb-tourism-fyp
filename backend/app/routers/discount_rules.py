from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.discount_rule import DiscountRule
from app.models.listing import Listing
from app.models.user import User
from app.schemas.discount_rule import (
    DiscountRuleCreate,
    DiscountRuleResponse,
    DiscountRuleUpdate,
)


router = APIRouter(prefix="/discount-rules", tags=["Discount Rules"])


def _ensure_listing_owner(
    db: Session,
    *,
    listing_id: int,
    current_user: User,
) -> Listing:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your listing")
    return listing


def _ensure_rule_owner(
    db: Session,
    *,
    rule_id: int,
    current_user: User,
) -> DiscountRule:
    rule = db.get(DiscountRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Discount rule not found")
    listing = db.get(Listing, rule.listing_id)
    if not listing or (
        listing.owner_id != current_user.id and current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Not your listing")
    return rule


@router.post(
    "/listings/{listing_id}",
    response_model=DiscountRuleResponse,
    status_code=201,
)
def create_discount_rule_for_listing(
    listing_id: int,
    body: DiscountRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_listing_owner(db, listing_id=listing_id, current_user=current_user)

    rule = DiscountRule(
        listing_id=listing_id,
        rule_type=body.rule_type,
        min_nights=body.min_nights,
        max_nights=body.max_nights,
        book_within_days=body.book_within_days,
        book_days_ahead=body.book_days_ahead,
        discount_percent=body.discount_percent,
        label=body.label,
        is_active=body.is_active,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get(
    "/listings/{listing_id}",
    response_model=list[DiscountRuleResponse],
)
def list_active_discount_rules_for_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    rules = (
        db.query(DiscountRule)
        .filter(
            DiscountRule.listing_id == listing_id,
            DiscountRule.is_active.is_(True),
        )
        .order_by(DiscountRule.id.asc())
        .all()
    )
    return rules


@router.patch(
    "/{rule_id}",
    response_model=DiscountRuleResponse,
)
def update_discount_rule(
    rule_id: int,
    body: DiscountRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = _ensure_rule_owner(db, rule_id=rule_id, current_user=current_user)

    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_discount_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = _ensure_rule_owner(db, rule_id=rule_id, current_user=current_user)
    db.delete(rule)
    db.commit()
    return None

