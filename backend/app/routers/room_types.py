from typing import Optional

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
    bed_type: Optional[str] = None
    amenities: Optional[str] = None
    available_count: int = 5
    total_rooms: int = 1


@router.get("/{listing_id}")
def get_room_types(
    listing_id: int,
    db: Session = Depends(get_db),
):
    rooms = (
        db.query(RoomType)
        .filter(RoomType.listing_id == listing_id)
        .order_by(RoomType.price_per_night.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "listing_id": r.listing_id,
            "name": r.name,
            "description": getattr(
                r, 'description', None
            ),
            "price_per_night": r.price_per_night,
            "capacity": getattr(
                r, 'capacity', 2
            ) or 2,
            "bed_type": getattr(
                r, 'bed_type', None
            ),
            "amenities": getattr(
                r, 'amenities', None
            ),
            "image_url": getattr(
                r, 'image_url', None
            ),
            "available_count": getattr(
                r, 'available_count',
                getattr(r, 'total_rooms', 5)
            ) or 5,
            "total_rooms": getattr(r, "total_rooms", 1) or 1,
            "is_available": True
        }
        for r in rooms
    ]


@router.post("/{listing_id}")
def create_room_type(
    listing_id: int,
    body: RoomTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from ..models.listing import Listing
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not your listing")

    room = RoomType(
        listing_id=listing_id,
        name=body.name,
        description=body.description,
        price_per_night=body.price_per_night,
        capacity=body.capacity,
        bed_type=body.bed_type,
        amenities=body.amenities,
        available_count=body.available_count,
        total_rooms=body.total_rooms,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return {
        "id": room.id,
        "listing_id": room.listing_id,
        "name": room.name,
        "description": room.description,
        "price_per_night": room.price_per_night,
        "capacity": room.capacity,
        "bed_type": getattr(
            room, 'bed_type', None
        ),
        "amenities": getattr(
            room, 'amenities', None
        ),
        "available_count": getattr(
            room, 'available_count', 5
        ),
        "total_rooms": getattr(room, "total_rooms", 1),
        "is_available": True
    }


@router.put("/{room_type_id}")
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
    room.bed_type = body.bed_type
    room.amenities = body.amenities
    room.available_count = body.available_count
    room.total_rooms = body.total_rooms
    db.commit()
    db.refresh(room)
    return {
        "id": room.id,
        "listing_id": room.listing_id,
        "name": room.name,
        "description": room.description,
        "price_per_night": room.price_per_night,
        "capacity": room.capacity,
        "bed_type": getattr(room, "bed_type", None),
        "amenities": getattr(room, "amenities", None),
        "available_count": getattr(room, "available_count", 5),
        "total_rooms": getattr(room, "total_rooms", 1),
        "is_available": True,
    }


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

