from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    # Supported roles: "user", "provider", "admin"
    role = Column(String, default="user", nullable=False)
    tax_id = Column(String, nullable=True, default=None)
    # Stores provider's NTN or GST registration number
    # Nullable — regular users and providers without tax ID leave this as None
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user")
    owned_listings = relationship("Listing", back_populates="owner")
    reviews = relationship("Review", back_populates="reviewer")
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    payout_requests = relationship("PayoutRequest", back_populates="provider")
