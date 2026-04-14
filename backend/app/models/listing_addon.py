from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class ListingAddon(Base):
    __tablename__ = "listing_addons"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    # Allowed values: per_night, per_person, per_booking
    price_type = Column(String, nullable=False, default="per_night")
    is_optional = Column(Boolean, nullable=False, default=True)
    max_quantity = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)

    listing = relationship("Listing", back_populates="addons")
    room_type = relationship("RoomType")
