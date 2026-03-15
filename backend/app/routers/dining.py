from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.database import get_db
from app.models.dining_package import DiningPackage
from app.models.table_reservation import TableReservation
from app.models.listing import Listing
from app.dependencies.auth import get_current_user
from app.utils.notify import create_notification

router = APIRouter(prefix="/dining", tags=["Dining"])

PACKAGE_TYPES = {
    "dine_in": "🍽️ Dine-In",
    "high_tea": "☕ High Tea",
    "buffet": "🍱 Buffet",
    "bbq": "🔥 BBQ Night",
    "full_board": "🥗 Full Board",
    "half_board": "🥘 Half Board",
    "pool": "🏊 Pool Access",
    "sports": "🎾 Sports & Activities",
    "private_dining": "🕯️ Private Dining",
}


class PackageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    package_type: str
    price_per_person: float
    min_persons: int = 1
    max_persons: int = 10
    duration_hours: float = 2.0


class ReservationCreate(BaseModel):
    listing_id: int
    package_id: Optional[int] = None
    reservation_date: str
    reservation_time: str
    persons: int = 2
    special_requests: Optional[str] = None


@router.get("/packages/{listing_id}")
def get_packages(
    listing_id: int,
    db: Session = Depends(get_db),
):
    packages = db.query(DiningPackage).filter(
        DiningPackage.listing_id == listing_id,
        DiningPackage.is_available == True,
    ).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "package_type": p.package_type,
            "package_label": PACKAGE_TYPES.get(
                p.package_type, p.package_type
            ),
            "price_per_person": p.price_per_person,
            "min_persons": p.min_persons,
            "max_persons": p.max_persons,
            "duration_hours": p.duration_hours,
        }
        for p in packages
    ]


@router.post("/packages/{listing_id}")
def create_package(
    listing_id: int,
    body: PackageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()
    if not listing:
        raise HTTPException(
            status_code=404, detail="Listing not found"
        )
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not your listing"
        )

    pkg = DiningPackage(
        listing_id=listing_id,
        name=body.name,
        description=body.description,
        package_type=body.package_type,
        price_per_person=body.price_per_person,
        min_persons=body.min_persons,
        max_persons=body.max_persons,
        duration_hours=body.duration_hours,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return {
        "id": pkg.id,
        "name": pkg.name,
        "package_type": pkg.package_type,
        "price_per_person": pkg.price_per_person,
    }


@router.delete("/packages/{package_id}")
def delete_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    pkg = db.query(DiningPackage).filter(
        DiningPackage.id == package_id
    ).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Not found")
    listing = db.query(Listing).filter(
        Listing.id == pkg.listing_id
    ).first()
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not allowed"
        )
    db.delete(pkg)
    db.commit()
    return {"ok": True}


@router.post("/reserve")
def make_reservation(
    body: ReservationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    listing = db.query(Listing).filter(
        Listing.id == body.listing_id
    ).first()
    if not listing:
        raise HTTPException(
            status_code=404, detail="Restaurant not found"
        )

    total_price = 0.0
    package_name = None

    if body.package_id:
        pkg = db.query(DiningPackage).filter(
            DiningPackage.id == body.package_id,
        ).first()
        if pkg:
            if body.persons < pkg.min_persons:
                raise HTTPException(
                    status_code=400,
                    detail=f"Minimum {pkg.min_persons} persons",
                )
            total_price = (
                pkg.price_per_person * body.persons
            )
            package_name = pkg.name
    else:
        total_price = (
            (listing.price_per_night or listing.price or 0)
            * body.persons
        )

    reservation = TableReservation(
        listing_id=body.listing_id,
        user_id=current_user.id,
        package_id=body.package_id,
        package_name=package_name,
        reservation_date=body.reservation_date,
        reservation_time=body.reservation_time,
        persons=body.persons,
        total_price=total_price,
        special_requests=body.special_requests,
        status="confirmed",
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    create_notification(
        db,
        user_id=current_user.id,
        title="Table Reserved! 🍽️",
        message=(
            f"Your table at '{listing.title}' "
            f"is reserved for "
            f"{body.reservation_date} at "
            f"{body.reservation_time} "
            f"for {body.persons} persons."
        ),
        type="success",
    )
    create_notification(
        db,
        user_id=listing.owner_id,
        title="New Reservation! 🍽️",
        message=(
            f"{current_user.full_name} reserved "
            f"a table for {body.persons} persons "
            f"on {body.reservation_date} at "
            f"{body.reservation_time}."
        ),
        type="booking",
    )

    return {
        "id": reservation.id,
        "listing_title": listing.title,
        "reservation_date": reservation.reservation_date,
        "reservation_time": reservation.reservation_time,
        "persons": reservation.persons,
        "total_price": reservation.total_price,
        "package_name": package_name,
        "status": "confirmed",
    }


@router.get("/my-reservations")
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reservations = (
        db.query(TableReservation)
        .filter(TableReservation.user_id == current_user.id)
        .order_by(TableReservation.created_at.desc())
        .all()
    )

    result = []
    for r in reservations:
        listing = (
            db.query(Listing)
            .filter(Listing.id == r.listing_id)
            .first()
        )
        result.append({
            "id": r.id,
            "listing_id": r.listing_id,
            "listing_title": listing.title if listing else "Unknown",
            "location": listing.location if listing else "",
            "image_url": listing.image_url if listing else None,
            "package_name": r.package_name,
            "reservation_date": r.reservation_date,
            "reservation_time": r.reservation_time,
            "persons": r.persons,
            "total_price": r.total_price,
            "special_requests": r.special_requests,
            "status": r.status,
            "created_at": (
                r.created_at.isoformat()
                if r.created_at else None
            ),
        })
    return result


@router.patch("/reservations/{res_id}/cancel")
def cancel_reservation(
    res_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    res = (
        db.query(TableReservation)
        .filter(
            TableReservation.id == res_id,
            TableReservation.user_id == current_user.id,
        )
        .first()
    )
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    res.status = "cancelled"
    db.commit()
    return {"ok": True}


@router.get("/provider-reservations")
def get_provider_reservations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in ["provider", "admin"]:
        raise HTTPException(
            status_code=403, detail="Providers only"
        )

    listings = db.query(Listing).filter(
        Listing.owner_id == current_user.id
    ).all()
    listing_ids = [l.id for l in listings]
    listing_map = {l.id: l for l in listings}

    reservations = (
        db.query(TableReservation)
        .filter(
            TableReservation.listing_id.in_(listing_ids)
        )
        .order_by(TableReservation.created_at.desc())
        .all()
    )

    from app.models.user import User

    result = []
    for r in reservations:
        listing = listing_map.get(r.listing_id)
        guest = (
            db.query(User).filter(User.id == r.user_id).first()
        )
        result.append({
            "id": r.id,
            "listing_title": (
                listing.title if listing else "Unknown"
            ),
            "guest_name": (
                guest.full_name if guest else "Unknown"
            ),
            "guest_email": guest.email if guest else "",
            "package_name": r.package_name,
            "reservation_date": r.reservation_date,
            "reservation_time": r.reservation_time,
            "persons": r.persons,
            "total_price": r.total_price,
            "status": r.status,
            "special_requests": r.special_requests,
            "created_at": (
                r.created_at.isoformat()
                if r.created_at else None
            ),
        })
    return result
