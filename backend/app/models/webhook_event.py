"""
WebhookEvent model — tracks processed webhook event IDs for idempotency.

Both Stripe and XPay webhook endpoints write to this table before
confirming a booking so that retried deliveries are silently skipped.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    # Globally unique event identifier (Stripe: evt_xxx, XPay: derived key)
    event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    # "stripe" | "xpay"
    source = Column(String, nullable=False, default="unknown")
    processed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
