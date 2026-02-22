from datetime import date, datetime

from pydantic import BaseModel


class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date


class BookingResponse(BaseModel):
    id: int
    listing_id: int
    check_in: date
    check_out: date
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
