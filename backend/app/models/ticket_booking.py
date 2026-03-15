from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)

from app.database import Base


class TicketBooking(Base):
    __tablename__ = "ticket_bookings"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    ticket_type_id = Column(Integer, ForeignKey("ticket_types.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0)
    total_price = Column(Float, default=0)
    platform_commission = Column(Float, default=0)
    organizer_amount = Column(Float, default=0)
    booking_ref = Column(String, unique=True, nullable=False)
    status = Column(String, default="confirmed")  # confirmed, cancelled, attended
    payment_status = Column(String, default="unpaid")  # unpaid, paid, free
    payment_method = Column(String, nullable=True)
    card_last4 = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
