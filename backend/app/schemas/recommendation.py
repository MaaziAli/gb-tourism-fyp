from pydantic import BaseModel

from app.schemas.listing import ListingResponse


class RecommendationResponse(BaseModel):
    id: int
    title: str
    location: str
    price_per_night: float
    service_type: str
    image_url: str | None
    owner_id: int
    recommendation_reason: str
    match_score: float
    recommendation_source: str = "rule_based"

    model_config = {"from_attributes": True}

