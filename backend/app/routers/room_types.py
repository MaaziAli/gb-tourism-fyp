from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.room_type import RoomType
from ..models.listing import Listing
from ..dependencies.auth import get_current_user


router = APIRouter(prefix="/room-types", tags=["Room Types"])


class RoomTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_night: float
    capacity: int = 2
    total_rooms: int = 1


class RoomTypeResponse(BaseModel):
    id: int
    listing_id: int
    name: str
    description: Optional[str] = None
    price_per_night: float
    capacity: int
    total_rooms: int

    model_config = {"from_attributes": True}


@router.get("/{listing_id}", response_model=List[RoomTypeResponse])
def get_room_types(
    listing_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(RoomType)
        .filter(RoomType.listing_id == listing_id)
        .all()
    )


@router.post("/{listing_id}", response_model=RoomTypeResponse)
def create_room_type(
    listing_id: int,
    body: RoomTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    room = RoomType(
        listing_id=listing_id,
        name=body.name,
        description=body.description,
        price_per_night=body.price_per_night,
        capacity=body.capacity,
        total_rooms=body.total_rooms,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.put("/{room_type_id}", response_model=RoomTypeResponse)
def update_room_type(
    room_type_id: int,
    body: RoomTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    room = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room type not found")
    listing = (
        db.query(Listing).filter(Listing.id == room.listing_id).first()
    )
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    room.name = body.name
    room.description = body.description
    room.price_per_night = body.price_per_night
    room.capacity = body.capacity
    room.total_rooms = body.total_rooms
    db.commit()
    db.refresh(room)
    return room


@router.delete("/{room_type_id}", status_code=204)
def delete_room_type(
    room_type_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    room = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Not found")
    listing = (
        db.query(Listing).filter(Listing.id == room.listing_id).first()
    )
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    db.delete(room)
    db.commit()

