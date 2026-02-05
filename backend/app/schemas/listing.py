from pydantic import BaseModel

class ListingBase(BaseModel):
    title: str
    location: str
    price_per_night: float

class ListingCreate(ListingBase):
    pass

class ListingResponse(ListingBase):
    id: int
