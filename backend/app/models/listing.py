from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True)
    location = Column(String)
    price = Column(Float)
    service_type = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    description = Column(String, nullable=True)

    owner = relationship("User", back_populates="owned_listings")
    bookings = relationship("Booking", back_populates="listing")
    reviews = relationship(
        "Review",
        back_populates="listing",
        cascade="all, delete-orphan",
    )
    images = relationship(
        "ListingImage",
        back_populates="listing",
        cascade="all, delete-orphan",
        order_by="ListingImage.sort_order",
    )
    room_types = relationship(
        "RoomType",
        back_populates="listing",
        cascade="all, delete-orphan",
    )
    dining_packages = relationship(
        "DiningPackage",
        back_populates="listing",
        cascade="all, delete-orphan",
    )

    @property
    def price_per_night(self) -> float:
        """Alias for API compatibility with price_per_night."""
        return self.price
