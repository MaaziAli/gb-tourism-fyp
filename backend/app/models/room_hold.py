from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database import Base


class RoomHold(Base):
    __tablename__ = "room_holds"

    id = Column(Integer, primary_key=True, index=True)
    room_type_id = Column(Integer, ForeignKey("room_types.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)  # null until booking created
    quantity = Column(Integer, nullable=False, default=1)
    hold_expires_at = Column(DateTime, nullable=False, default=lambda: datetime.utcnow())
    status = Column(String, default="active")  # active, released, converted
    created_at = Column(DateTime, default=datetime.utcnow)
