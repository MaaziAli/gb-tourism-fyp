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
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User
from app.schemas.listing import ListingResponse, ListingUpdate


router = APIRouter(prefix="/listings", tags=["Listings"])

# Save listing images under backend/uploads/
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _save_image(image: UploadFile | None) -> str | None:
    """
    Persist an uploaded image to backend/uploads/ and return the filename.
    """
    if image is None:
        return None
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
    description: str | None = Form(None),
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
        description=description,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/", response_model=list[ListingResponse])
def get_listings(db: Session = Depends(get_db)):
    """Get all listings."""
    return db.query(Listing).all()


@router.get("/me", response_model=list[ListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all listings owned by the current user."""
    return db.query(Listing).filter(Listing.owner_id == current_user.id).all()


@router.get("/debug-upload-dir")
def debug_upload_dir():
    import os

    files: list[str] = []
    exists = UPLOAD_DIR.exists()
    if exists:
        files = os.listdir(UPLOAD_DIR)
    return {
        "upload_dir": str(UPLOAD_DIR),
        "upload_dir_absolute": str(UPLOAD_DIR.resolve()),
        "exists": exists,
        "files_count": len(files),
        "files": files[:10],
    }


@router.get("/check-images")
def check_listing_images(db: Session = Depends(get_db)):
    """
    Utility endpoint to report which listings have missing image files.

    This is intended for development-time cleanup only.
    """
    listings = db.query(Listing).all()
    total = len(listings)
    with_image = 0
    files_found = 0
    files_missing = 0
    missing: list[dict] = []
    found: list[dict] = []

    for listing in listings:
        if not listing.image_url:
            continue
        with_image += 1
        image_path = UPLOAD_DIR / listing.image_url
        info = {
            "id": listing.id,
            "title": listing.title,
            "image_url": listing.image_url,
        }
        if image_path.exists():
            files_found += 1
            found.append(info)
        else:
            files_missing += 1
            missing.append(info)

    return {
        "total_listings": total,
        "listings_with_image_url": with_image,
        "files_found": files_found,
        "files_missing": files_missing,
        "missing": missing,
        "found": found,
    }


@router.post("/clear-missing-images")
def clear_missing_listing_images(db: Session = Depends(get_db)):
    """
    Utility endpoint to clear image_url for listings whose files are missing.

    One-time cleanup helper for development:
    1. Call /listings/check-images to inspect.
    2. Call this endpoint to set image_url=None for broken entries.
    3. Re-upload images via the Edit Listing page.
    """
    listings = db.query(Listing).all()
    cleared_ids: list[int] = []

    for listing in listings:
        if not listing.image_url:
            continue
        image_path = UPLOAD_DIR / listing.image_url
        if not image_path.exists():
            listing.image_url = None
            cleared_ids.append(listing.id)

    if cleared_ids:
        db.commit()

    return {"cleared": len(cleared_ids), "listing_ids_cleared": cleared_ids}


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
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing listing."""
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to edit this listing",
        )
    listing.title = title
    listing.location = location
    listing.price = price_per_night
    listing.service_type = service_type
    if description is not None:
        listing.description = description

    # When a new image is uploaded, replace the old file on disk and update image_url.
    if image is not None:
        old_image = listing.image_url
        image_filename = _save_image(image)
        if image_filename is not None:
            listing.image_url = image_filename
            if old_image:
                old_file = UPLOAD_DIR / old_image
                if old_file.exists():
                    old_file.unlink()
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
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this listing",
        )
    # Prevent deleting listings that still have bookings
    has_booking = (
        db.query(Booking)
        .filter(Booking.listing_id == listing_id, Booking.status == "active")
        .first()
    )
    if has_booking:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete listing with existing bookings. Please cancel bookings first.",
        )
    db.delete(listing)
    db.commit()
    return None
