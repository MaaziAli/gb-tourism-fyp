from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    venue = Column(String, nullable=False)
    location = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    event_time = Column(String, nullable=False)
    end_time = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    total_capacity = Column(Integer, default=100)
    is_free = Column(Boolean, default=False)
    status = Column(String, default="active")
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organizer = relationship("User")
