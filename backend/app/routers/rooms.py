"""
Rooms router — CRUD for hotel room types.

Room types are backed by the RoomType model (linked to a hotel Listing).
Provides availability management and per-room image uploads.
"""
import json
import shutil
from pathlib import Path
from uuid import uuid4

from datetime import date as date_type
from typing import Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Query, UploadFile,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.room_type import RoomType
from app.models.user import User

router = APIRouter(prefix="/rooms", tags=["Rooms"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _save_image(image: UploadFile | None) -> str | None:
    if image is None:
        return None
    suffix = Path(image.filename).suffix
    filename = f"{uuid4().hex}{suffix}"
    with (UPLOAD_DIR / filename).open("wb") as f:
        shutil.copyfileobj(image.file, f)
    return filename


def _room_dict(room: RoomType) -> dict:
    amenities: list[str] = []
    if room.amenities:
        try:
            amenities = json.loads(room.amenities)
        except Exception:
            pass
    return {
        "id": room.id,
        "hotel_id": room.listing_id,
        "room_type": room.name,
        "name": room.name,
        "description": room.description,
        "price_per_night": room.price_per_night,
        "capacity": room.capacity,
        "bed_type": room.bed_type,
        "total_rooms": room.total_rooms or 1,
        "available_rooms": room.available_count,
        "amenities": amenities,
        "image_url": room.image_url,
        "breakfast_included": getattr(room, "breakfast_included", False) or False,
    }


def _require_hotel_owner(
    hotel_id: int,
    current_user: User,
    db: Session,
) -> Listing:
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not your hotel")
    return hotel


# ── GET rooms for a hotel ─────────────────────────────────────────────────────

@router.get("/hotel/{hotel_id}")
def list_rooms_for_hotel(
    hotel_id: int,
    db: Session = Depends(get_db),
):
    """Public: list all room types for a hotel."""
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    rooms = (
        db.query(RoomType)
        .filter(RoomType.listing_id == hotel_id)
        .all()
    )
    return [_room_dict(r) for r in rooms]


# ── GET single room ───────────────────────────────────────────────────────────

@router.get("/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(RoomType).filter(RoomType.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return _room_dict(room)


# ── CREATE room ───────────────────────────────────────────────────────────────

@router.post("/hotel/{hotel_id}")
def create_room(
    hotel_id: int,
    room_type: str = Form(..., description="e.g. single, double, suite, deluxe"),
    description: str | None = Form(None),
    price_per_night: float = Form(...),
    capacity: int = Form(2),
    bed_type: str | None = Form(None),
    total_rooms: int = Form(1),
    available_rooms: int | None = Form(None),
    amenities: str | None = Form(None),
    breakfast_included: bool = Form(False),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a room type to a hotel. Provider / Admin only."""
    _require_hotel_owner(hotel_id, current_user, db)

    image_filename = _save_image(image)
    room = RoomType(
        listing_id=hotel_id,
        name=room_type,
        description=description,
        price_per_night=price_per_night,
        capacity=capacity,
        bed_type=bed_type,
        total_rooms=total_rooms,
        available_count=available_rooms if available_rooms is not None else total_rooms,
        amenities=amenities,
        breakfast_included=breakfast_included,
        image_url=image_filename,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return _room_dict(room)


# ── UPDATE room ───────────────────────────────────────────────────────────────

@router.put("/{room_id}")
def update_room(
    room_id: int,
    room_type: str = Form(...),
    description: str | None = Form(None),
    price_per_night: float = Form(...),
    capacity: int = Form(2),
    bed_type: str | None = Form(None),
    total_rooms: int = Form(1),
    available_rooms: int | None = Form(None),
    amenities: str | None = Form(None),
    breakfast_included: bool = Form(False),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(RoomType).filter(RoomType.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    _require_hotel_owner(room.listing_id, current_user, db)

    room.name = room_type
    room.description = description
    room.price_per_night = price_per_night
    room.capacity = capacity
    room.bed_type = bed_type
    room.total_rooms = total_rooms
    room.breakfast_included = breakfast_included
    if available_rooms is not None:
        room.available_count = available_rooms
    if amenities is not None:
        room.amenities = amenities

    if image is not None:
        old_img = room.image_url
        new_filename = _save_image(image)
        if new_filename:
            room.image_url = new_filename
            if old_img:
                old_path = UPLOAD_DIR / old_img
                if old_path.exists():
                    old_path.unlink()

    db.commit()
    db.refresh(room)
    return _room_dict(room)


# ── DELETE room ───────────────────────────────────────────────────────────────

@router.delete("/{room_id}", status_code=204)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(RoomType).filter(RoomType.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    _require_hotel_owner(room.listing_id, current_user, db)

    # Check no active bookings for this room type
    active = (
        db.query(Booking)
        .filter(
            Booking.room_type_id == room_id,
            Booking.status.in_(["active", "confirmed"]),
        )
        .first()
    )
    if active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete room with active bookings",
        )

    db.delete(room)
    db.commit()
    return None


# ── GET real-time availability for all rooms in a hotel ───────────────────────

@router.get("/hotel/{hotel_id}/availability")
def get_hotel_rooms_availability(
    hotel_id: int,
    check_in: Optional[date_type] = Query(None),
    check_out: Optional[date_type] = Query(None),
    db: Session = Depends(get_db),
):
    """Return all room types for a hotel with real-time available count for dates."""
    hotel = (
        db.query(Listing)
        .filter(Listing.id == hotel_id, Listing.service_type == "hotel")
        .first()
    )
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    rooms = db.query(RoomType).filter(RoomType.listing_id == hotel_id).all()

    result = []
    for room in rooms:
        booked = 0
        if check_in and check_out and check_in < check_out:
            booked = (
                db.query(func.count(Booking.id))
                .filter(
                    Booking.room_type_id == room.id,
                    Booking.status.in_(["active", "confirmed"]),
                    Booking.check_in < check_out,
                    Booking.check_out > check_in,
                )
                .scalar() or 0
            )
        total = room.total_rooms or 1
        available = max(0, total - booked)
        d = _room_dict(room)
        d["available_rooms"] = available
        d["booked_count"] = booked
        d["is_available"] = available > 0
        result.append(d)
    return result


# ── PATCH availability ────────────────────────────────────────────────────────

@router.patch("/{room_id}/availability")
def update_room_availability(
    room_id: int,
    available_rooms: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick endpoint to update available room count."""
    room = db.query(RoomType).filter(RoomType.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    _require_hotel_owner(room.listing_id, current_user, db)

    if available_rooms < 0:
        raise HTTPException(status_code=400, detail="Available rooms cannot be negative")
    if room.total_rooms and available_rooms > room.total_rooms:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot exceed total rooms ({room.total_rooms})",
        )

    room.available_count = available_rooms
    db.commit()
    db.refresh(room)
    return _room_dict(room)
