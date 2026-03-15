from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class TicketType(Base):
    __tablename__ = "ticket_types"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, default=0)
    capacity = Column(Integer, default=50)
    sold_count = Column(Integer, default=0)
    is_free = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    event = relationship("Event")
