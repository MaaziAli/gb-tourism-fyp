from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(
        Integer, ForeignKey("users.id"),
        nullable=False,
    )
    listing_id = Column(
        Integer, ForeignKey("listings.id"),
        nullable=True,
    )
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    discount_type = Column(String, nullable=False)
    discount_value = Column(Float, nullable=False)

    min_booking_amount = Column(Float, default=0)
    max_discount_amount = Column(Float, nullable=True)

    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)

    max_uses_per_user = Column(Integer, default=1)

    valid_from = Column(String, nullable=True)
    valid_until = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)

    coupon_type = Column(String, default="general")

    scope = Column(String, default="provider")
    provider_id = Column(
        Integer, ForeignKey("users.id"),
        nullable=True,
    )

    # 1 = can combine with group discount; 0 = cannot combine
    is_stackable = Column(Integer, default=1)
    influencer_name = Column(String, nullable=True)
    tier = Column(String, default="standard")

    created_at = Column(DateTime, default=datetime.utcnow)


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(
        Integer, ForeignKey("coupons.id"),
        nullable=False,
    )
    user_id = Column(
        Integer, ForeignKey("users.id"),
        nullable=False,
    )
    booking_id = Column(Integer, nullable=True)
    discount_applied = Column(Float, default=0)
    used_at = Column(DateTime, default=datetime.utcnow)
