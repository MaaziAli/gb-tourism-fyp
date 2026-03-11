"""
Listings router - full CRUD operations for tourism listings.
"""
from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import ListingResponse, ListingUpdate


router = APIRouter(prefix="/listings", tags=["Listings"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def _save_image(image: UploadFile | None) -> str | None:
    if image is None:
        return None
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = Path(image.filename).suffix
    filename = f"{uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return filename


@router.post("/", response_model=ListingResponse)
def create_listing(
    title: str = Form(...),
    location: str = Form(...),
    price_per_night: float = Form(...),
    service_type: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new listing."""
    if current_user.role != "provider":
        raise HTTPException(
            status_code=403,
            detail="Only providers can create listings",
        )
    image_filename = _save_image(image)
    listing = Listing(
        owner_id=current_user.id,
        title=title,
        location=location,
        price=price_per_night,
        service_type=service_type,
        image_url=image_filename,
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
    title: str = Form(...),
    location: str = Form(...),
    price_per_night: float = Form(...),
    service_type: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing listing."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
    listing.title = title
    listing.location = location
    listing.price = price_per_night
    listing.service_type = service_type
    if image is not None:
        image_filename = _save_image(image)
        if image_filename is not None:
            listing.image_url = image_filename
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
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
    db.delete(listing)
    db.commit()
    return None
