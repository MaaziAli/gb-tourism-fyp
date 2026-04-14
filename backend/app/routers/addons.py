from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.listing_addon import ListingAddon
from app.models.room_type import RoomType
from app.models.user import User
from app.utils.addon_utils import PRICE_TYPES

router = APIRouter(tags=["Listing Addons"])


class AddonCreateBody(BaseModel):
    room_type_id: int | None = None
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = None
    price: float = Field(..., gt=0)
    price_type: str = "per_night"
    is_optional: bool = True
    max_quantity: int = Field(default=1, ge=1, le=99)
    is_active: bool = True
    sort_order: int = 0


class AddonUpdateBody(BaseModel):
    room_type_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    price_type: str | None = None
    is_optional: bool | None = None
    max_quantity: int | None = Field(default=None, ge=1, le=99)
    is_active: bool | None = None
    sort_order: int | None = None


def _serialize(addon: ListingAddon) -> dict:
    return {
        "id": addon.id,
        "listing_id": addon.listing_id,
        "room_type_id": addon.room_type_id,
        "name": addon.name,
        "description": addon.description,
        "price": float(addon.price),
        "price_type": addon.price_type,
        "is_optional": bool(addon.is_optional),
        "max_quantity": int(addon.max_quantity or 1),
        "is_active": bool(addon.is_active),
        "sort_order": int(addon.sort_order or 0),
    }


def _ensure_owner_or_admin(listing: Listing, user: User):
    if user.role == "admin":
        return
    if listing.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this listing")


def _validate_price_type(price_type: str):
    if price_type not in PRICE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="price_type must be one of: per_night, per_person, per_booking",
        )


def _validate_room_type(db: Session, listing_id: int, room_type_id: int | None):
    if room_type_id is None:
        return
    room = (
        db.query(RoomType)
        .filter(RoomType.id == room_type_id, RoomType.listing_id == listing_id)
        .first()
    )
    if not room:
        raise HTTPException(status_code=400, detail="Invalid room_type_id for listing")


@router.get("/listings/{listing_id}/addons")
def get_listing_addons(
    listing_id: int,
    room_type_id: int | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    query = db.query(ListingAddon).filter(ListingAddon.listing_id == listing_id)
    if not include_inactive:
        query = query.filter(ListingAddon.is_active.is_(True))

    if room_type_id is not None:
        query = query.filter(
            or_(
                ListingAddon.room_type_id.is_(None),
                ListingAddon.room_type_id == room_type_id,
            )
        )

    addons = query.order_by(ListingAddon.sort_order.asc(), ListingAddon.id.asc()).all()
    return [_serialize(a) for a in addons]


@router.post("/listings/{listing_id}/addons")
def create_listing_addon(
    listing_id: int,
    body: AddonCreateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner_or_admin(listing, current_user)
    _validate_price_type(body.price_type)
    _validate_room_type(db, listing_id, body.room_type_id)

    addon = ListingAddon(
        listing_id=listing_id,
        room_type_id=body.room_type_id,
        name=body.name.strip(),
        description=(body.description or "").strip() or None,
        price=float(body.price),
        price_type=body.price_type,
        is_optional=body.is_optional,
        max_quantity=body.max_quantity,
        is_active=body.is_active,
        sort_order=body.sort_order,
    )
    db.add(addon)
    db.commit()
    db.refresh(addon)
    return _serialize(addon)


@router.put("/addons/{addon_id}")
def update_addon(
    addon_id: int,
    body: AddonUpdateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addon = db.get(ListingAddon, addon_id)
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on not found")

    listing = db.get(Listing, addon.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner_or_admin(listing, current_user)

    if body.price_type is not None:
        _validate_price_type(body.price_type)
    if body.room_type_id is not None:
        _validate_room_type(db, addon.listing_id, body.room_type_id)

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "name" and value is not None:
            value = value.strip()
        if key == "description" and value is not None:
            value = value.strip() or None
        setattr(addon, key, value)

    db.commit()
    db.refresh(addon)
    return _serialize(addon)


@router.delete("/addons/{addon_id}")
def delete_addon(
    addon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addon = db.get(ListingAddon, addon_id)
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on not found")

    listing = db.get(Listing, addon.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner_or_admin(listing, current_user)

    db.delete(addon)
    db.commit()
    return {"success": True}
