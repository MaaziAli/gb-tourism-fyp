from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from app.database import Base


class AvailabilityBlock(Base):
    __tablename__ = "availability_blocks"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=False,
    )
    block_date = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    is_manual = Column(Boolean, default=True)
