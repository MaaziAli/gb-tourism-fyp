"""
Seed local development data for GB Tourism.

What this script does:
1) Ensures all SQLAlchemy tables exist.
2) Applies sqlite schema compatibility columns for legacy db files.
3) Creates admin + provider users if missing.
4) Creates sample listings for the provider if missing.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure backend/ is importable when executed as: python seed_data.py
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.db_bootstrap import ensure_sqlite_schema_compat

# Import models so SQLAlchemy registers all tables before create_all()
from app.models import availability as _availability_model  # noqa: F401
from app.models import booking as _booking_model  # noqa: F401
from app.models import coupon as _coupon_model  # noqa: F401
from app.models import dining_package as _dining_model  # noqa: F401
from app.models import event as _event_model  # noqa: F401
from app.models import listing as _listing_model  # noqa: F401
from app.models import listing_addon as _listing_addon_model  # noqa: F401
from app.models import listing_image as _listing_image_model  # noqa: F401
from app.models import loyalty as _loyalty_model  # noqa: F401
from app.models import message as _message_model  # noqa: F401
from app.models import notification as _notification_model  # noqa: F401
from app.models import payment as _payment_model  # noqa: F401
from app.models import recently_viewed as _recently_viewed_model  # noqa: F401
from app.models import refund as _refund_model  # noqa: F401
from app.models import review as _review_model  # noqa: F401
from app.models import room_type as _room_type_model  # noqa: F401
from app.models import seasonal_price as _seasonal_price_model  # noqa: F401
from app.models import table_reservation as _table_res_model  # noqa: F401
from app.models import ticket_booking as _ticket_booking_model  # noqa: F401
from app.models import ticket_type as _ticket_type_model  # noqa: F401
from app.models import trip_plan as _trip_plan_model  # noqa: F401
from app.models import user as _user_model  # noqa: F401
from app.models import webhook_event as _webhook_event_model  # noqa: F401
from app.models import wishlist as _wishlist_model  # noqa: F401
from app.models.listing import Listing
from app.models.user import User


ADMIN_EMAIL = "admin@gbtourism.com"
ADMIN_PASSWORD = "Admin@12345"
PROVIDER_EMAIL = "provider@gbtourism.com"
PROVIDER_PASSWORD = "Provider@12345"


def ensure_user(
    db,
    *,
    full_name: str,
    email: str,
    password: str,
    role: str,
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        changed = False
        if user.role != role:
            user.role = role
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_listing(
    db,
    owner_id: int,
    *,
    title: str,
    location: str,
    price: float,
    service_type: str,
    description: str,
    amenities: list[str],
    is_featured: bool = True,
) -> Listing:
    listing = (
        db.query(Listing)
        .filter(Listing.owner_id == owner_id, Listing.title == title)
        .first()
    )
    amenities_json = json.dumps(amenities)

    if listing:
        listing.location = location
        listing.price = price
        listing.service_type = service_type
        listing.description = description
        listing.amenities = amenities_json
        listing.is_featured = is_featured
        db.commit()
        db.refresh(listing)
        return listing

    listing = Listing(
        owner_id=owner_id,
        title=title,
        location=location,
        price=price,
        service_type=service_type,
        description=description,
        amenities=amenities_json,
        is_featured=is_featured,
        cancellation_policy="moderate",
        cancellation_hours_free=48,
        rooms_available=10,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def main() -> None:
    print("== GB Tourism seed_data.py ==")
    print(f"DATABASE_URL: {settings.DATABASE_URL}")

    Base.metadata.create_all(bind=engine)
    upgraded = ensure_sqlite_schema_compat(settings.DATABASE_URL)
    if upgraded:
        print("Schema updates applied:")
        for entry in upgraded:
            print(f"  - {entry}")
    else:
        print("Schema already compatible.")

    db = SessionLocal()
    try:
        admin = ensure_user(
            db,
            full_name="GB Tourism Admin",
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            role="admin",
        )
        provider = ensure_user(
            db,
            full_name="Sample Provider",
            email=PROVIDER_EMAIL,
            password=PROVIDER_PASSWORD,
            role="provider",
        )

        samples = [
            {
                "title": "Hunza Eagle Nest Hotel",
                "location": "Hunza",
                "price": 18000.0,
                "service_type": "hotel",
                "description": "Mountain-view hotel with breakfast and valley tours.",
                "amenities": ["wifi", "parking", "breakfast", "mountain_view"],
            },
            {
                "title": "Skardu Adventure Day Tour",
                "location": "Skardu",
                "price": 9500.0,
                "service_type": "tour",
                "description": "Guided day tour covering Upper Kachura and Shigar Fort.",
                "amenities": ["guide", "transport", "photography_stops"],
            },
            {
                "title": "Attabad Lake Boating Experience",
                "location": "Hunza",
                "price": 4500.0,
                "service_type": "activity",
                "description": "Shared boating activity with safety gear and local host.",
                "amenities": ["safety_gear", "boat", "local_host"],
            },
        ]

        created_or_updated = []
        for payload in samples:
            listing = ensure_listing(db, provider.id, **payload)
            created_or_updated.append((listing.id, listing.title))

        total_users = db.query(User).count()
        total_listings = db.query(Listing).count()

        print("\nSeed complete.")
        print(f"Admin:    {admin.email} / {ADMIN_PASSWORD}")
        print(f"Provider: {provider.email} / {PROVIDER_PASSWORD}")
        print("Sample listings:")
        for listing_id, title in created_or_updated:
            print(f"  - #{listing_id}: {title}")
        print(f"Totals -> users: {total_users}, listings: {total_listings}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
