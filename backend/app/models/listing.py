from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    location = Column(String)
    price = Column(Float)

    bookings = relationship("Booking", back_populates="listing")

    @property
    def price_per_night(self) -> float:
        """Alias for API compatibility with price_per_night."""
        return self.price
