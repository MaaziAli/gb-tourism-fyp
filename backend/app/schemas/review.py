from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None
    cleanliness_rating: float = 0
    location_rating: float = 0
    value_rating: float = 0
    staff_rating: float = 0
    facilities_rating: float = 0


class ReviewResponse(BaseModel):
    id: int
    listing_id: int
    user_id: int
    rating: int
    comment: str | None
    created_at: datetime
    reviewer_name: str
    cleanliness_rating: float = 0
    location_rating: float = 0
    value_rating: float = 0
    staff_rating: float = 0
    facilities_rating: float = 0
    provider_reply: str | None = None
    provider_reply_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProviderReplyBody(BaseModel):
    reply: str
