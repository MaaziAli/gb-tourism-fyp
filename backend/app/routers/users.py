"""
User account management routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current authenticated user."""
    return current_user


@router.delete("/me")
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete the current user's account."""
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}

