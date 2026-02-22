from pydantic import BaseModel


class ListingBase(BaseModel):
    title: str
    location: str
    price_per_night: float
    service_type: str


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: str | None = None
    location: str | None = None
    price_per_night: float | None = None
    service_type: str | None = None


class ListingResponse(ListingBase):
    id: int

    model_config = {"from_attributes": True}
