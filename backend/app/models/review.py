from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    cleanliness_rating = Column(Float, default=0)
    location_rating = Column(Float, default=0)
    value_rating = Column(Float, default=0)
    staff_rating = Column(Float, default=0)
    facilities_rating = Column(Float, default=0)
    review_photos = Column(String, nullable=True)
    provider_reply = Column(String, nullable=True)
    provider_reply_at = Column(DateTime, nullable=True)

    listing = relationship("Listing", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

