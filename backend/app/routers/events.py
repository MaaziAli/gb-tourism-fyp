import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.event import Event
from app.models.ticket_type import TicketType
from app.models.user import User

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/events", tags=["Events"])

EVENT_CATEGORIES = [
    "Music & Cultural Festival",
    "Polo & Horse Events",
    "Guided Trek & Expedition",
    "Art & Photography",
    "Local Festival & Fair",
    "Sports Event",
    "Food & Dining Event",
    "Community Gathering",
    "Horse Riding & Adventure",
    "Other",
]


class TicketTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0
    capacity: int = 50
    is_free: bool = False


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    venue: str
    location: str
    event_date: str
    event_time: str
    end_time: Optional[str] = None
    total_capacity: int = 100
    is_free: bool = False
    ticket_types: Optional[List[TicketTypeCreate]] = []


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    venue: Optional[str] = None
    location: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    end_time: Optional[str] = None
    total_capacity: Optional[int] = None
    is_free: Optional[bool] = None
    status: Optional[str] = None


def event_to_dict(event: Event, db: Session, include_tickets: bool = False):
    organizer = event.organizer
    tickets = (
        db.query(TicketType).filter(TicketType.event_id == event.id).all()
        if include_tickets
        else []
    )
    total_sold = sum(t.sold_count for t in tickets)
    paid = [t.price for t in tickets if not t.is_free]
    min_price = min(paid) if paid else 0

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "venue": event.venue,
        "location": event.location,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "end_time": event.end_time,
        "image_url": event.image_url,
        "total_capacity": event.total_capacity,
        "is_free": event.is_free,
        "status": event.status,
        "is_featured": event.is_featured,
        "created_at": event.created_at.isoformat() if event.created_at else "",
        "organizer_id": event.organizer_id,
        "organizer_name": organizer.full_name if organizer else "Unknown",
        "tickets_sold": total_sold,
        "spots_remaining": max(0, event.total_capacity - total_sold),
        "starting_price": min_price,
        "ticket_types": [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "price": t.price,
                "capacity": t.capacity,
                "sold_count": t.sold_count,
                "is_free": t.is_free,
                "is_active": t.is_active,
                "available": max(0, t.capacity - t.sold_count),
            }
            for t in tickets
        ]
        if include_tickets
        else [],
    }


@router.get("/categories")
def get_categories():
    return EVENT_CATEGORIES


@router.get("/featured")
def get_featured_events(db: Session = Depends(get_db)):
    events = (
        db.query(Event)
        .filter(Event.is_featured.is_(True), Event.status == "active")
        .limit(6)
        .all()
    )
    return [event_to_dict(e, db) for e in events]


@router.get("/my-events")
def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .order_by(Event.created_at.desc())
        .all()
    )
    return [event_to_dict(e, db, include_tickets=True) for e in events]


@router.get("/")
def get_events(
    category: Optional[str] = None,
    location: Optional[str] = None,
    is_free: Optional[bool] = None,
    status: str = "active",
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(Event.status == status)
    if category:
        query = query.filter(Event.category == category)
    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))
    if is_free is not None:
        query = query.filter(Event.is_free == is_free)
    events = query.order_by(Event.event_date.asc()).all()
    return [event_to_dict(e, db) for e in events]


@router.post("/")
def create_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("provider", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can create events",
        )

    event = Event(
        organizer_id=current_user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        venue=body.venue,
        location=body.location,
        event_date=body.event_date,
        event_time=body.event_time,
        end_time=body.end_time,
        total_capacity=body.total_capacity,
        is_free=body.is_free,
        status="active",
    )
    db.add(event)
    db.flush()

    if body.ticket_types:
        for tt in body.ticket_types:
            ticket = TicketType(
                event_id=event.id,
                name=tt.name,
                description=tt.description,
                price=tt.price,
                capacity=tt.capacity,
                is_free=tt.is_free or tt.price == 0,
            )
            db.add(ticket)
    else:
        default = TicketType(
            event_id=event.id,
            name="General Admission",
            price=0 if body.is_free else 500,
            capacity=body.total_capacity,
            is_free=body.is_free,
        )
        db.add(default)

    db.commit()
    db.refresh(event)
    return event_to_dict(event, db, include_tickets=True)


@router.delete("/ticket-types/{tt_id}")
def delete_ticket_type(
    tt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tt = db.query(TicketType).filter(TicketType.id == tt_id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Not found")
    event = db.query(Event).filter(Event.id == tt.event_id).first()
    if not event or (
        event.organizer_id != current_user.id and current_user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(tt)
    db.commit()
    return {"ok": True}


@router.get("/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_to_dict(event, db, include_tickets=True)


@router.post("/{event_id}/upload-image")
async def upload_event_image(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Invalid file type")

    filename = f"event_{uuid.uuid4()}{ext}"
    dest = UPLOAD_DIR / filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    event.image_url = filename
    db.commit()
    return {"image_url": filename}


@router.put("/{event_id}")
def update_event(
    event_id: int,
    body: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    data = body.model_dump(exclude_none=True)
    for field, value in data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event_to_dict(event, db, include_tickets=True)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    db.query(TicketType).filter(TicketType.event_id == event_id).delete()
    db.delete(event)
    db.commit()
    return {"ok": True}


@router.post("/{event_id}/ticket-types")
def add_ticket_type(
    event_id: int,
    body: TicketTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    ticket = TicketType(
        event_id=event_id,
        name=body.name,
        description=body.description,
        price=body.price,
        capacity=body.capacity,
        is_free=body.is_free or body.price == 0,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {
        "id": ticket.id,
        "name": ticket.name,
        "price": ticket.price,
        "capacity": ticket.capacity,
        "is_free": ticket.is_free,
    }


@router.patch("/{event_id}/feature")
def toggle_feature(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    event.is_featured = not bool(event.is_featured)
    db.commit()
    return {"is_featured": event.is_featured}
