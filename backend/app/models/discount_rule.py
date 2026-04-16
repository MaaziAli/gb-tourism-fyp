from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class DiscountRule(Base):
    __tablename__ = "discount_rules"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rule_type = Column(
        String,
        nullable=False,
        doc="length_of_stay | last_minute | advance_booking",
    )
    # Length-of-stay based
    min_nights = Column(Integer, nullable=True)
    max_nights = Column(Integer, nullable=True)
    # Last-minute: book within N days of check-in
    book_within_days = Column(Integer, nullable=True)
    # Advance booking: at least N days before check-in
    book_days_ahead = Column(Integer, nullable=True)

    discount_percent = Column(Numeric(5, 2), nullable=False)
    label = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("Listing", back_populates="discount_rules")

