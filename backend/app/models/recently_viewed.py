from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.database import Base


class RecentlyViewed(Base):
    __tablename__ = "recently_viewed"

    id = Column(
        Integer, primary_key=True, index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    listing_id = Column(
        Integer,
        ForeignKey("listings.id"),
        nullable=False
    )
    viewed_at = Column(
        DateTime, default=datetime.utcnow
    )
