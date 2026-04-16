from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, JSON, String
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
    amenities = Column(String, nullable=True)
    is_featured = Column(Boolean, default=False)
    cancellation_policy = Column(String, default="moderate")
    cancellation_hours_free = Column(Integer, default=48)
    is_approved = Column(Boolean, default=False, nullable=False)
    rejection_reason = Column(String, nullable=True, default=None)
    rooms_available = Column(Integer, default=10)
    max_capacity_per_day = Column(Integer, nullable=True)

    # Car-rental-specific fields
    pickup_location = Column(String, nullable=True)
    dropoff_location = Column(String, nullable=True)
    pickup_time = Column(String, nullable=True)
    dropoff_time = Column(String, nullable=True)
    insurance_options = Column(JSON, nullable=True)
    fuel_policy = Column(String, nullable=True, default="full_to_full")
    mileage_limit = Column(Integer, nullable=True)

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
    addons = relationship(
        "ListingAddon",
        back_populates="listing",
        cascade="all, delete-orphan",
    )
    tour_date_capacities = relationship(
        "TourDateCapacity",
        cascade="all, delete-orphan",
    )

    @property
    def price_per_night(self) -> float:
        """Alias for API compatibility with price_per_night."""
        return self.price
