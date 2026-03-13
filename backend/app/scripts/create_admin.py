import os
import sys

# Ensure project root (backend/) is on sys.path when run as a script
sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ),
)

# Import all models so SQLAlchemy can resolve relationship() strings
from app.models import user as _user_module  # noqa: F401
from app.models import listing as _listing_module  # noqa: F401
from app.models import booking as _booking_module  # noqa: F401

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


def create_admin():
    db = SessionLocal()
    try:
        existing = (
            db.query(User)
            .filter(User.email == "admin@gbtourism.com")
            .first()
        )
        if existing:
            print("Admin user already exists!")
            print(f"Role: {existing.role}")
            return

        admin = User(
            full_name="GB Tourism Admin",
            email="admin@gbtourism.com",
            hashed_password=hash_password("Admin@12345"),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user created successfully!")
        print("Email: admin@gbtourism.com")
        print("Password: Admin@12345")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()


