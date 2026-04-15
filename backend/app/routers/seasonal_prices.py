"""
Seasonal Prices router – provider-only CRUD for seasonal pricing rules.
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.seasonal_price import SeasonalPrice
from app.models.user import User

router = APIRouter(tags=["Seasonal Prices"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class SeasonalPriceCreate(BaseModel):
    name: str
    start_date: date_type
    end_date: date_type
    price_multiplier: float = 1.0
    fixed_surcharge: float = 0.0
    is_active: bool = True

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("end_date must be >= start_date")
        return v

    @field_validator("price_multiplier")
    @classmethod
    def multiplier_positive(cls, v):
        if v <= 0:
            raise ValueError("price_multiplier must be > 0")
        return v

    @field_validator("fixed_surcharge")
    @classmethod
    def surcharge_non_negative(cls, v):
        if v < 0:
            raise ValueError("fixed_surcharge must be >= 0")
        return v


class SeasonalPriceUpdate(SeasonalPriceCreate):
    pass


def _sp_to_dict(sp: SeasonalPrice) -> dict:
    return {
        "id": sp.id,
        "listing_id": sp.listing_id,
        "name": sp.name,
        "start_date": sp.start_date.isoformat(),
        "end_date": sp.end_date.isoformat(),
        "price_multiplier": sp.price_multiplier,
        "fixed_surcharge": sp.fixed_surcharge,
        "is_active": sp.is_active,
        "created_at": sp.created_at.isoformat() if sp.created_at else None,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/listings/{listing_id}/seasonal-prices")
def list_seasonal_prices(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    prices = (
        db.query(SeasonalPrice)
        .filter(SeasonalPrice.listing_id == listing_id)
        .order_by(SeasonalPrice.start_date)
        .all()
    )
    return [_sp_to_dict(p) for p in prices]


@router.post("/listings/{listing_id}/seasonal-prices", status_code=201)
def create_seasonal_price(
    listing_id: int,
    body: SeasonalPriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    sp = SeasonalPrice(
        listing_id=listing_id,
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        price_multiplier=body.price_multiplier,
        fixed_surcharge=body.fixed_surcharge,
        is_active=body.is_active,
    )
    db.add(sp)
    db.commit()
    db.refresh(sp)
    return _sp_to_dict(sp)


@router.put("/seasonal-prices/{price_id}")
def update_seasonal_price(
    price_id: int,
    body: SeasonalPriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sp = db.get(SeasonalPrice, price_id)
    if not sp:
        raise HTTPException(status_code=404, detail="Seasonal price not found")
    listing = db.get(Listing, sp.listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    sp.name = body.name
    sp.start_date = body.start_date
    sp.end_date = body.end_date
    sp.price_multiplier = body.price_multiplier
    sp.fixed_surcharge = body.fixed_surcharge
    sp.is_active = body.is_active
    db.commit()
    db.refresh(sp)
    return _sp_to_dict(sp)


@router.delete("/seasonal-prices/{price_id}", status_code=204)
def delete_seasonal_price(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sp = db.get(SeasonalPrice, price_id)
    if not sp:
        raise HTTPException(status_code=404, detail="Seasonal price not found")
    listing = db.get(Listing, sp.listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    db.delete(sp)
    db.commit()
    return None
