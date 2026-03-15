from pathlib import Path
import shutil
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.listing_image import ListingImage


# Same as listings router + main static mount: backend/uploads/
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/listing-images", tags=["Listing Images"])


@router.post("/{listing_id}")
async def upload_listing_image(
    listing_id: int,
    file: UploadFile = File(...),
    caption: str = Form(default=""),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    ext = Path(file.filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Invalid file type")

    filename = f"{uuid.uuid4()}{ext}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    count = (
        db.query(ListingImage)
        .filter(ListingImage.listing_id == listing_id)
        .count()
    )

    img = ListingImage(
        listing_id=listing_id,
        filename=filename,
        caption=caption or None,
        sort_order=count,
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return {
        "id": img.id,
        "filename": img.filename,
        "caption": img.caption,
        "sort_order": img.sort_order,
        "url": f"/uploads/{img.filename}",
    }


@router.get("/{listing_id}")
def get_listing_images(
    listing_id: int,
    db: Session = Depends(get_db),
):
    images = (
        db.query(ListingImage)
        .filter(ListingImage.listing_id == listing_id)
        .order_by(ListingImage.sort_order)
        .all()
    )
    return [
        {
            "id": img.id,
            "filename": img.filename,
            "caption": img.caption,
            "sort_order": img.sort_order,
            "url": f"/uploads/{img.filename}",
        }
        for img in images
    ]


@router.delete("/{image_id}")
def delete_listing_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    img = (
        db.query(ListingImage)
        .filter(ListingImage.id == image_id)
        .first()
    )
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    listing = (
        db.query(Listing)
        .filter(Listing.id == img.listing_id)
        .first()
    )
    if listing.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    file_path = UPLOAD_DIR / img.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(img)
    db.commit()
    return {"deleted": True}

