from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.database import Base


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"),
        nullable=False,
    )
    listing_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow)
