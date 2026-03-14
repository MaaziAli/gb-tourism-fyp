from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, ForeignKey, Text, Boolean
)
from datetime import datetime
from app.database import Base


class TripPlan(Base):
    __tablename__ = "trip_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    title = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    duration_days = Column(Integer, nullable=False)
    budget_tier = Column(String, nullable=False)
    # budget, standard, luxury
    total_budget = Column(Float, nullable=False)
    estimated_cost = Column(Float, default=0)
    hotel_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=True
    )
    transport_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=True
    )
    activities = Column(Text, default="[]")
    # JSON string of listing IDs
    notes = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)
    share_code = Column(String, nullable=True, unique=True)
    created_at = Column(
        DateTime, default=datetime.utcnow
    )
