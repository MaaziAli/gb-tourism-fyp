from pydantic import BaseModel


class ListingBase(BaseModel):
    title: str
    location: str
    price_per_night: float
    service_type: str
    image_url: str | None = None
    description: str | None = None
    amenities: str | None = None


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: str | None = None
    location: str | None = None
    price_per_night: float | None = None
    service_type: str | None = None


class ListingResponse(ListingBase):
    id: int
    owner_id: int
    cancellation_policy: str | None = "moderate"
    cancellation_hours_free: int | None = 48
    rooms_available: int | None = 10
    max_capacity_per_day: int | None = None

    model_config = {"from_attributes": True}
