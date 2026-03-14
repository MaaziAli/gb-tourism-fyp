"""
User account management routes.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current authenticated user."""
    return current_user


class UserUpdate(BaseModel):
  full_name: Optional[str] = None


@router.put("/me")
def update_profile(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.full_name:
        current_user.full_name = body.full_name.strip()
        db.commit()
        db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
    }


@router.delete("/me", status_code=204)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete the current user's account.

    Prevent deletion if:
    - The user owns any listings.
    - The user has any active future bookings.
    """
    # Block providers (or any user) who still own listings
    listings_count = (
        db.query(Listing).filter(Listing.owner_id == current_user.id).count()
    )
    if listings_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete account because you have existing listings. "
                "Please delete all your listings first."
            ),
        )

    # Block users who still have active future bookings
    today = date.today()
    active_bookings_count = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.status == "active",
            Booking.check_in >= today,
        )
        .count()
    )
    if active_bookings_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete account because you have active bookings. "
                "Please cancel your bookings first."
            ),
        )

    db.delete(current_user)
    db.commit()
    return None


