from sqlalchemy import Column, Integer, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from app.database import Base


class BookingRoom(Base):
    __tablename__ = "booking_rooms"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="CASCADE"),
                          nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    # unit_price = snapshot of price_per_night at time of booking

    booking = relationship("Booking", back_populates="room_selections")
    room_type = relationship("RoomType")
