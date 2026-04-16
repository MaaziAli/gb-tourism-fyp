from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, field_validator, validator


class RoomSelectionInput(BaseModel):
    room_type_id: int
    quantity: int

    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v < 1:
            raise ValueError('quantity must be at least 1')
        return v


class RoomSelectionResponse(BaseModel):
    room_type_id: int
    room_type_name: str
    quantity: int
    unit_price: float
    subtotal: float  # unit_price * quantity * nights

    model_config = {"from_attributes": True}


class BookingModifyRequest(BaseModel):
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    room_type_id: Optional[int] = None


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    room_type_id: int | None = None
    guests: int = 1
    room_quantity: int = 1
    coupon_code: str | None = None
    loyalty_points_used: int = 0
    rental_details: dict | None = None
    room_selections: list[RoomSelectionInput] = []


class BookingResponse(BaseModel):
    id: int
    listing_id: int
    user_id: int
    total_price: float
    status: str
    payment_status: str = "unpaid"
    check_in: date | None = None
    check_out: date | None = None
    created_at: datetime
    room_type_id: int | None = None
    room_type_name: str | None = None
    loyalty_points_used: int = 0
    loyalty_discount_applied: float = 0.0
    price_adjustment: Optional[float] = None
    room_selections: list[RoomSelectionResponse] = []

    model_config = {"from_attributes": True}

    @field_validator('room_selections', mode='before')
    @classmethod
    def coerce_room_selections(cls, v):
        """
        When an ORM Booking object is serialized via from_attributes, SQLAlchemy
        BookingRoom objects land here.  They can't be coerced to RoomSelectionResponse
        directly (missing subtotal / room_type_name), so return [] and let the
        endpoint build the list manually when needed.
        """
        if not v:
            return []
        first = v[0]
        if isinstance(first, (dict, RoomSelectionResponse)):
            return v
        # ORM object — caller must build RoomSelectionResponse manually
        return []


class BookingCancellationResponse(BookingResponse):
    refund_eligible: bool = False
