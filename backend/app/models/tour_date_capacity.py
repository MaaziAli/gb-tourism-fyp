from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, UniqueConstraint

from app.database import Base


class TourDateCapacity(Base):
    __tablename__ = "tour_date_capacities"
    __table_args__ = (
        UniqueConstraint("listing_id", "tour_date", name="uq_tour_date_capacity_listing_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tour_date = Column(Date, nullable=False, index=True)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
