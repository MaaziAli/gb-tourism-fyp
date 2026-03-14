from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, ForeignKey
)
from datetime import datetime
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(
        Integer, ForeignKey("bookings.id"), nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    amount = Column(Float, nullable=False)
    platform_commission = Column(Float, nullable=False)
    provider_amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    # pending, completed, failed
    payment_method = Column(String, default="card")
    card_last4 = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    created_at = Column(
        DateTime, default=datetime.utcnow
    )
