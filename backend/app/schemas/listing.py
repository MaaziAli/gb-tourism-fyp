from pydantic import BaseModel


class ListingBase(BaseModel):
    title: str
    location: str
    price_per_night: float
    service_type: str
    image_url: str | None = None
    description: str | None = None
    amenities: str | None = None
    wheelchair_accessible: bool = False
    accessible_bathroom: bool = False
    elevator_access: bool = False
    braille_signage: bool = False
    hearing_loop: bool = False
    visual_alerts: bool = False


class ListingCreate(ListingBase):
    wheelchair_accessible: bool = False
    accessible_bathroom: bool = False
    elevator_access: bool = False
    braille_signage: bool = False
    hearing_loop: bool = False
    visual_alerts: bool = False


class ListingUpdate(BaseModel):
    title: str | None = None
    location: str | None = None
    price_per_night: float | None = None
    service_type: str | None = None
    wheelchair_accessible: bool | None = None
    accessible_bathroom: bool | None = None
    elevator_access: bool | None = None
    braille_signage: bool | None = None
    hearing_loop: bool | None = None
    visual_alerts: bool | None = None


class ListingResponse(ListingBase):
    id: int
    owner_id: int
    cancellation_policy: str | None = "moderate"
    cancellation_hours_free: int | None = 48
    rooms_available: int | None = 10
    max_capacity_per_day: int | None = None
    is_approved: bool = False
    rejection_reason: str | None = None

    model_config = {"from_attributes": True}
