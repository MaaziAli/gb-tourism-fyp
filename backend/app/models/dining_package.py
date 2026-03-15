from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from app.database import Base


class DiningPackage(Base):
    __tablename__ = "dining_packages"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=False
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    package_type = Column(String, nullable=False)
    # dine_in, high_tea, buffet, bbq, full_board,
    # half_board, pool, sports, private_dining
    price_per_person = Column(Float, nullable=False)
    min_persons = Column(Integer, default=1)
    max_persons = Column(Integer, default=10)
    duration_hours = Column(Float, default=2.0)
    is_available = Column(Boolean, default=True)

    listing = relationship(
        "Listing", back_populates="dining_packages"
    )
