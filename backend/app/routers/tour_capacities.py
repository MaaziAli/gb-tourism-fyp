from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator, model_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.tour_date_capacity import TourDateCapacity
from app.models.user import User

SINGLE_DATE_TYPES = {"tour", "activity", "horse_riding", "guide"}

router = APIRouter(tags=["Tour Capacities"])


class TourCapacityDateInput(BaseModel):
    tour_date: date_type
    capacity: int

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, value: int) -> int:
        if value < 0:
            raise ValueError("capacity must be >= 0")
        return value


class TourCapacityCreate(BaseModel):
    tour_date: date_type | None = None
    start_date: date_type | None = None
    end_date: date_type | None = None
    capacity: int | None = None
    capacities: list[TourCapacityDateInput] | None = None

    @model_validator(mode="after")
    def validate_input_mode(self):
        if self.capacities:
            return self
        if self.tour_date is not None and self.capacity is not None:
            return self
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.capacity is not None
        ):
            if self.end_date < self.start_date:
                raise ValueError("end_date must be >= start_date")
            return self
        raise ValueError(
            "Provide either capacities[], or (tour_date + capacity), or "
            "(start_date + end_date + capacity)"
        )


class TourCapacityUpdate(BaseModel):
    capacity: int

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, value: int) -> int:
        if value < 0:
            raise ValueError("capacity must be >= 0")
        return value


def _capacity_to_dict(record: TourDateCapacity) -> dict:
    return {
        "id": record.id,
        "listing_id": record.listing_id,
        "tour_date": record.tour_date.isoformat(),
        "capacity": record.capacity,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }


def _validate_owner_and_type(
    listing: Listing | None,
    current_user: User,
):
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    if listing.service_type not in SINGLE_DATE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Per-date tour capacities are only supported for single-date services",
        )


def _upsert_capacity(
    db: Session,
    *,
    listing_id: int,
    target_date: date_type,
    capacity: int,
) -> TourDateCapacity:
    existing = (
        db.query(TourDateCapacity)
        .filter(
            TourDateCapacity.listing_id == listing_id,
            TourDateCapacity.tour_date == target_date,
        )
        .first()
    )
    if existing:
        existing.capacity = capacity
        return existing

    created = TourDateCapacity(
        listing_id=listing_id,
        tour_date=target_date,
        capacity=capacity,
    )
    db.add(created)
    return created


@router.get("/listings/{listing_id}/tour-capacities")
def list_tour_capacities(
    listing_id: int,
    start_date: date_type | None = Query(None),
    end_date: date_type | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)
    _validate_owner_and_type(listing, current_user)
    if start_date and end_date and end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")

    query = db.query(TourDateCapacity).filter(TourDateCapacity.listing_id == listing_id)
    if start_date:
        query = query.filter(TourDateCapacity.tour_date >= start_date)
    if end_date:
        query = query.filter(TourDateCapacity.tour_date <= end_date)

    records = query.order_by(TourDateCapacity.tour_date.asc()).all()
    return [_capacity_to_dict(record) for record in records]


@router.post("/listings/{listing_id}/tour-capacities", status_code=201)
def create_tour_capacities(
    listing_id: int,
    body: TourCapacityCreate | list[TourCapacityDateInput],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)
    _validate_owner_and_type(listing, current_user)

    changed_records: list[TourDateCapacity] = []
    if isinstance(body, list):
        for item in body:
            changed_records.append(
                _upsert_capacity(
                    db,
                    listing_id=listing_id,
                    target_date=item.tour_date,
                    capacity=item.capacity,
                )
            )
    elif body.capacities:
        for item in body.capacities:
            changed_records.append(
                _upsert_capacity(
                    db,
                    listing_id=listing_id,
                    target_date=item.tour_date,
                    capacity=item.capacity,
                )
            )
    elif body.tour_date is not None and body.capacity is not None:
        changed_records.append(
            _upsert_capacity(
                db,
                listing_id=listing_id,
                target_date=body.tour_date,
                capacity=body.capacity,
            )
        )
    else:
        assert body.start_date is not None and body.end_date is not None
        assert body.capacity is not None
        current = body.start_date
        while current <= body.end_date:
            changed_records.append(
                _upsert_capacity(
                    db,
                    listing_id=listing_id,
                    target_date=current,
                    capacity=body.capacity,
                )
            )
            current += timedelta(days=1)

    db.commit()
    for record in changed_records:
        db.refresh(record)
    changed_records.sort(key=lambda r: r.tour_date)
    return [_capacity_to_dict(record) for record in changed_records]


@router.put("/tour-capacities/{capacity_id}")
def update_tour_capacity(
    capacity_id: int,
    body: TourCapacityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(TourDateCapacity, capacity_id)
    if not record:
        raise HTTPException(status_code=404, detail="Capacity override not found")

    listing = db.get(Listing, record.listing_id)
    _validate_owner_and_type(listing, current_user)

    record.capacity = body.capacity
    db.commit()
    db.refresh(record)
    return _capacity_to_dict(record)


@router.delete("/tour-capacities/{capacity_id}", status_code=204)
def delete_tour_capacity(
    capacity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(TourDateCapacity, capacity_id)
    if not record:
        raise HTTPException(status_code=404, detail="Capacity override not found")

    listing = db.get(Listing, record.listing_id)
    _validate_owner_and_type(listing, current_user)

    db.delete(record)
    db.commit()
    return None
