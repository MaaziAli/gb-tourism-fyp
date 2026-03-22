from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(
        Integer, primary_key=True, index=True
    )
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id"),
        nullable=True
    )
    listing_id = Column(
        Integer,
        ForeignKey("listings.id"),
        nullable=False
    )
    sender_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    receiver_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(
        DateTime, default=datetime.utcnow
    )
