"""Coupon API — static path routes are registered before dynamic /{coupon_id} routes."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.coupon_helpers import record_coupon_use, validate_coupon_logic
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.coupon import Coupon, CouponUsage
from app.models.listing import Listing
from app.models.user import User

router = APIRouter(
    prefix="/coupons",
    tags=["Coupons"],
)

COUPON_TYPES = {
    "general": "🎟️ General",
    "celebrity": "⭐ Celebrity/Influencer",
    "event": "🎪 Event Special",
    "flash": "⚡ Flash Sale",
    "first_booking": "🎉 First Booking",
    "vip": "💎 VIP Exclusive",
    "seasonal": "🌸 Seasonal",
    "eid": "🌙 Eid Special",
    "custom": "✨ Custom",
}


class CouponCreate(BaseModel):
    code: str
    title: str
    description: str | None = None
    influencer_name: str | None = None
    discount_type: str
    discount_value: float
    min_booking_amount: float = 0
    max_discount_amount: float | None = None
    max_uses: int | None = None
    # 0 = unlimited uses per user
    max_uses_per_user: int = 1
    valid_from: str | None = None
    valid_until: str | None = None
    is_public: bool = True
    coupon_type: str = "general"
    listing_id: int | None = None
    is_stackable: bool = True
    tier: str = "standard"
    scope: str | None = None


class ValidateCouponRequest(BaseModel):
    code: str
    listing_id: int | None = None
    listing_owner_id: int | None = None
    booking_amount: float


def coupon_to_dict(coupon: Coupon, db: Session) -> dict:
    usage_count = coupon.used_count or 0
    return {
        "id": coupon.id,
        "code": coupon.code,
        "title": coupon.title,
        "description": coupon.description,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_booking_amount": coupon.min_booking_amount or 0,
        "max_discount_amount": coupon.max_discount_amount,
        "max_uses": coupon.max_uses,
        "used_count": usage_count,
        "max_uses_per_user": (
            coupon.max_uses_per_user
            if coupon.max_uses_per_user is not None
            else 1
        ),
        "valid_from": coupon.valid_from,
        "valid_until": coupon.valid_until,
        "is_active": bool(coupon.is_active),
        "is_public": bool(coupon.is_public),
        "coupon_type": coupon.coupon_type or "general",
        "coupon_type_label": COUPON_TYPES.get(
            coupon.coupon_type or "general",
            coupon.coupon_type or "general",
        ),
        "created_at": (
            coupon.created_at.isoformat() if coupon.created_at else None
        ),
        "listing_id": coupon.listing_id,
        "is_stackable": bool(getattr(coupon, "is_stackable", 1)),
        "influencer_name": getattr(coupon, "influencer_name", None),
        "tier": getattr(coupon, "tier", None) or "standard",
        "spots_left": (
            coupon.max_uses - usage_count
            if coupon.max_uses is not None
            else None
        ),
        "scope": getattr(coupon, "scope", "provider"),
        "provider_id": getattr(coupon, "provider_id", None),
        "scope_label": {
            "all": "🌐 All Services",
            "provider": "🏨 My Services Only",
            "listing": "📌 Specific Service",
        }.get(
            getattr(coupon, "scope", "provider"),
            "🏨 My Services Only",
        ),
    }


# ══════════════════════════════════════
# Static routes first (no path parameters)
# ══════════════════════════════════════


@router.get("/my-coupons")
def get_my_coupons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupons = (
        db.query(Coupon)
        .filter(Coupon.created_by == current_user.id)
        .order_by(Coupon.created_at.desc())
        .all()
    )
    return [coupon_to_dict(c, db) for c in coupons]


@router.get("/public")
def get_public_coupons(
    db: Session = Depends(get_db),
):
    today = date.today().isoformat()
    coupons = (
        db.query(Coupon)
        .filter(Coupon.is_active.is_(True))
        .filter(Coupon.is_public.is_(True))
        .all()
    )
    valid = []
    for c in coupons:
        if c.valid_until and today > c.valid_until:
            continue
        used = c.used_count or 0
        if c.max_uses is not None and used >= c.max_uses:
            continue
        valid.append(coupon_to_dict(c, db))
    return valid


@router.get("/admin/all")
def admin_get_all_coupons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admins only")
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    result = []
    for c in coupons:
        d = coupon_to_dict(c, db)
        creator = db.query(User).filter(User.id == c.created_by).first()
        d["creator_name"] = creator.full_name if creator else "Unknown"
        result.append(d)
    return result


@router.post("/validate")
def validate_coupon(
    body: ValidateCouponRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == body.code.upper().strip())
        .first()
    )

    if not coupon:
        raise HTTPException(404, "Invalid coupon code")

    valid, message, discount = validate_coupon_logic(
        coupon,
        current_user.id,
        body.booking_amount,
        body.listing_id,
        db,
        listing_owner_id=body.listing_owner_id,
    )

    if not valid:
        raise HTTPException(400, message)

    return {
        "valid": True,
        "message": message,
        "code": coupon.code,
        "title": coupon.title,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "discount_amount": discount,
        "final_amount": max(0, body.booking_amount - discount),
        "coupon_type": coupon.coupon_type,
        "coupon_type_label": COUPON_TYPES.get(
            coupon.coupon_type, coupon.coupon_type
        ),
    }


@router.post("/apply")
def apply_coupon(
    body: ValidateCouponRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == body.code.upper().strip())
        .first()
    )

    if not coupon:
        raise HTTPException(404, "Invalid coupon code")

    valid, message, discount = validate_coupon_logic(
        coupon,
        current_user.id,
        body.booking_amount,
        body.listing_id,
        db,
        listing_owner_id=body.listing_owner_id,
    )

    if not valid:
        raise HTTPException(400, message)

    record_coupon_use(db, coupon, current_user.id, None, discount)
    db.commit()

    return {
        "ok": True,
        "discount_amount": discount,
        "final_amount": max(0, body.booking_amount - discount),
        "message": f"🎉 PKR {discount:,.0f} discount applied!",
    }


@router.post("/")
def create_coupon(
    body: CouponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("provider", "admin"):
        raise HTTPException(
            403,
            "Only providers can create coupons",
        )

    code = body.code.upper().strip().replace(" ", "")

    if not code:
        raise HTTPException(400, "Coupon code cannot be empty")

    existing = db.query(Coupon).filter(Coupon.code == code).first()
    if existing:
        raise HTTPException(
            400,
            f"Coupon code '{code}' already exists. "
            "Try a different code.",
        )

    if body.discount_type not in ("percentage", "flat"):
        raise HTTPException(
            400,
            "discount_type must be 'percentage' or 'flat'",
        )

    if body.discount_type == "percentage" and (
        body.discount_value <= 0 or body.discount_value > 100
    ):
        raise HTTPException(
            400,
            "Percentage must be between 1 and 100",
        )

    if body.discount_type == "flat" and body.discount_value <= 0:
        raise HTTPException(
            400,
            "Flat discount must be positive",
        )

    if body.listing_id:
        listing = (
            db.query(Listing)
            .filter(Listing.id == body.listing_id)
            .first()
        )
        if not listing:
            raise HTTPException(
                404,
                "Listing not found. "
                "Leave listing empty for global coupon.",
            )
        if (
            listing.owner_id != current_user.id
            and current_user.role != "admin"
        ):
            raise HTTPException(
                403,
                "You can only create coupons for your own listings",
            )

    desc = body.description
    if body.influencer_name and body.influencer_name.strip():
        extra = f"Influencer: {body.influencer_name.strip()}"
        desc = f"{desc}\n{extra}" if desc else extra

    if body.scope:
        scope = body.scope
    elif current_user.role == "admin":
        scope = "all"
    elif body.listing_id:
        scope = "listing"
    else:
        scope = "provider"

    provider_id = None
    if current_user.role == "provider":
        provider_id = current_user.id
    elif current_user.role == "admin":
        provider_id = None

    coupon = Coupon(
        created_by=current_user.id,
        provider_id=provider_id,
        listing_id=body.listing_id or None,
        scope=scope,
        code=code,
        title=body.title,
        description=desc,
        discount_type=body.discount_type,
        discount_value=body.discount_value,
        min_booking_amount=body.min_booking_amount or 0,
        max_discount_amount=body.max_discount_amount,
        max_uses=body.max_uses,
        max_uses_per_user=body.max_uses_per_user,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        is_public=body.is_public,
        coupon_type=body.coupon_type or "general",
        is_stackable=1 if body.is_stackable else 0,
        influencer_name=body.influencer_name.strip()
        if body.influencer_name
        else None,
        tier=body.tier or "standard",
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon_to_dict(coupon, db)


class CouponUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    discount_type: str | None = None
    discount_value: float | None = None
    min_booking_amount: float | None = None
    max_discount_amount: float | None = None
    max_uses: int | None = None
    max_uses_per_user: int | None = None
    valid_from: str | None = None
    valid_until: str | None = None
    is_public: bool | None = None
    coupon_type: str | None = None


@router.put("/{coupon_id}")
def update_coupon(
    coupon_id: int,
    body: CouponUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(404, "Not found")
    if (
        coupon.created_by != current_user.id
        and current_user.role != "admin"
    ):
        raise HTTPException(403, "Not allowed")

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        try:
            setattr(coupon, field, value)
        except Exception:
            pass

    db.commit()
    db.refresh(coupon)
    return coupon_to_dict(coupon, db)


# ══════════════════════════════════════
# Dynamic routes last
# ══════════════════════════════════════


@router.patch("/{coupon_id}/toggle")
def toggle_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = (
        db.query(Coupon)
        .filter(
            Coupon.id == coupon_id,
            Coupon.created_by == current_user.id,
        )
        .first()
    )
    if not coupon:
        raise HTTPException(404, "Not found")
    coupon.is_active = not coupon.is_active
    db.commit()
    return {"is_active": bool(coupon.is_active)}


@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(404, "Not found")
    if coupon.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")
    db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon_id
    ).delete()
    db.delete(coupon)
    db.commit()
    return {"ok": True}
