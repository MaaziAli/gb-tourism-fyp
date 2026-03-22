from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    status = Column(String, default="active", nullable=False)
    total_price = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=True)
    room_type_name = Column(String, nullable=True)
    payment_status = Column(String, default="unpaid")  # unpaid, paid

    group_size = Column(Integer, default=1)
    is_group_booking = Column(Boolean, default=False)
    group_lead_name = Column(String, nullable=True)
    group_discount_applied = Column(Float, default=0)
    price_per_person = Column(Float, nullable=True)
    special_requirements = Column(Text, nullable=True)

    user = relationship("User", back_populates="bookings")
    listing = relationship("Listing", back_populates="bookings")
