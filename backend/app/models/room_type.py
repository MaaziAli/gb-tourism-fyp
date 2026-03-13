from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price_per_night = Column(Float, nullable=False)
    capacity = Column(Integer, default=2)
    total_rooms = Column(Integer, default=1)

    listing = relationship("Listing", back_populates="room_types")

