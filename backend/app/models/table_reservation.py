from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class TableReservation(Base):
    __tablename__ = "table_reservations"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=False
    )
    user_id = Column(
        Integer, ForeignKey("users.id"),
        nullable=False
    )
    package_id = Column(
        Integer, ForeignKey("dining_packages.id"),
        nullable=True
    )
    package_name = Column(String, nullable=True)
    reservation_date = Column(String, nullable=False)
    reservation_time = Column(String, nullable=False)
    persons = Column(Integer, default=2)
    total_price = Column(Float, default=0)
    special_requests = Column(String, nullable=True)
    status = Column(String, default="confirmed")
    # confirmed, cancelled, completed
    payment_status = Column(String, default="unpaid")
    created_at = Column(
        DateTime, default=datetime.utcnow
    )
