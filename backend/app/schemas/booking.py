from datetime import date, datetime

from pydantic import BaseModel


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    room_type_id: int | None = None
    guests: int = 1
    coupon_code: str | None = None
    loyalty_points_used: int = 0


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

    model_config = {"from_attributes": True}
