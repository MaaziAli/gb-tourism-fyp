"""
Utility script to promote a test user to provider role for development.

Usage (from project root):

    uvicorn is not required. Just run:

        python -m app.scripts.promote_test_user_to_provider

Adjust TEST_USER_EMAIL below to match the test account you want to promote.
"""

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User


TEST_USER_EMAIL = "maaz@gmail.com"


def promote_user_to_provider(email: str) -> None:
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            print(f"No user found with email {email!r}")
            return
        previous_role = user.role
        user.role = "provider"
        db.commit()
        print(
            f"Updated user {email!r} role from {previous_role!r} to 'provider' "
            "for development/testing."
        )
    finally:
        db.close()


if __name__ == "__main__":
    promote_user_to_provider(TEST_USER_EMAIL)

