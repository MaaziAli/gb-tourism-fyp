from fastapi import APIRouter
from app.schemas.listing import ListingCreate, ListingResponse
from app.models.listing import listings_db

router = APIRouter(
    prefix="/listings",
    tags=["Listings"]
)

@router.post("/", response_model=ListingResponse)
def create_listing(listing: ListingCreate):
    new_listing = {
        "id": len(listings_db) + 1,
        **listing.dict()
    }
    listings_db.append(new_listing)
    return new_listing


@router.get("/", response_model=list[ListingResponse])
def get_listings():
    return listings_db
