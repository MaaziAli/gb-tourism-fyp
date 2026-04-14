from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    amount_refunded = Column(Float, nullable=False)
    refund_reason = Column(String, nullable=True)
    refunded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
