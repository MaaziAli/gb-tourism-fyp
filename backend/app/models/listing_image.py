from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(
        Integer,
        ForeignKey("listings.id"),
        nullable=False,
    )
    filename = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)

    listing = relationship("Listing", back_populates="images")

