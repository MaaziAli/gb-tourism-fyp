"""
Listings router - full CRUD operations for tourism listings.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import ListingCreate, ListingResponse, ListingUpdate

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.post("/", response_model=ListingResponse)
def create_listing(
    data: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new listing."""
    listing = Listing(
        title=data.title,
        location=data.location,
        price=data.price_per_night,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/", response_model=list[ListingResponse])
def get_listings(db: Session = Depends(get_db)):
    """Get all listings."""
    return db.query(Listing).all()


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    """Get a single listing by ID."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing listing."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    update_data = data.model_dump(exclude_unset=True)
    if "price_per_night" in update_data:
        update_data["price"] = update_data.pop("price_per_night")
    for field, value in update_data.items():
        setattr(listing, field, value)
    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a listing."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.delete(listing)
    db.commit()
    return None
