from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
  rating: int = Field(..., ge=1, le=5)
  comment: str | None = None


class ReviewResponse(BaseModel):
  id: int
  listing_id: int
  user_id: int
  rating: int
  comment: str | None
  created_at: datetime
  reviewer_name: str

  model_config = {"from_attributes": True}

