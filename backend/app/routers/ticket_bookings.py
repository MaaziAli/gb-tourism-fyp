import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.event import Event
from app.models.ticket_booking import TicketBooking
from app.models.ticket_type import TicketType
from app.models.user import User
from app.utils.notify import create_notification

router = APIRouter(
    prefix="/ticket-bookings",
    tags=["Ticket Bookings"],
)

COMMISSION_RATE = 0.10


class BookTicketRequest(BaseModel):
    event_id: int
    ticket_type_id: int
    quantity: int = 1
    payment_method: Optional[str] = "card"
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    card_name: Optional[str] = None


@router.post("/book")
def book_tickets(
    body: BookTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == body.event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    if event.status != "active":
        raise HTTPException(400, "Event not active")

    tt = (
        db.query(TicketType)
        .filter(
            TicketType.id == body.ticket_type_id,
            TicketType.event_id == body.event_id,
        )
        .first()
    )
    if not tt:
        raise HTTPException(404, "Ticket type not found")
    if not tt.is_active:
        raise HTTPException(400, "Ticket type not available")

    available = tt.capacity - tt.sold_count
    if body.quantity > available:
        raise HTTPException(
            400,
            f"Only {available} tickets available",
        )

    if body.payment_method == "card" and body.card_number:
        clean = body.card_number.replace(" ", "")
        if clean == "4000000000000002":
            raise HTTPException(
                400,
                "Payment declined. Try another card.",
            )

    unit_price = tt.price
    total_price = unit_price * body.quantity
    commission = (
        round(total_price * COMMISSION_RATE, 2) if total_price > 0 else 0
    )
    organizer_amount = round(total_price - commission, 2)

    booking_ref = "TKT-" + str(uuid.uuid4())[:8].upper()

    txn_id = None
    if total_price > 0:
        txn_id = "EVT-" + str(uuid.uuid4())[:12].upper()

    card_last4 = None
    if body.card_number:
        clean = body.card_number.replace(" ", "")
        card_last4 = clean[-4:] if len(clean) >= 4 else None

    booking = TicketBooking(
        event_id=body.event_id,
        ticket_type_id=body.ticket_type_id,
        user_id=current_user.id,
        quantity=body.quantity,
        unit_price=unit_price,
        total_price=total_price,
        platform_commission=commission,
        organizer_amount=organizer_amount,
        booking_ref=booking_ref,
        status="confirmed",
        payment_status="paid" if total_price > 0 else "free",
        payment_method=body.payment_method,
        card_last4=card_last4,
        transaction_id=txn_id,
    )
    db.add(booking)

    tt.sold_count += body.quantity
    db.commit()
    db.refresh(booking)

    create_notification(
        db,
        user_id=current_user.id,
        title="Tickets Confirmed! 🎟️",
        message=(
            f"{body.quantity} x {tt.name} for '{event.title}' on "
            f"{event.event_date}. Ref: {booking_ref}"
        ),
        type="success",
    )
    create_notification(
        db,
        user_id=event.organizer_id,
        title="New Ticket Sale! 🎉",
        message=(
            f"{current_user.full_name} bought {body.quantity} x {tt.name} "
            f"for '{event.title}'. Revenue: PKR {organizer_amount:,.0f}"
        ),
        type="booking",
    )

    return {
        "id": booking.id,
        "booking_ref": booking_ref,
        "event_title": event.title,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "venue": event.venue,
        "location": event.location,
        "ticket_name": tt.name,
        "quantity": body.quantity,
        "unit_price": unit_price,
        "total_price": total_price,
        "platform_commission": commission,
        "organizer_amount": organizer_amount,
        "payment_status": booking.payment_status,
        "transaction_id": txn_id,
        "card_last4": card_last4,
        "status": "confirmed",
    }


@router.get("/my-tickets")
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(TicketBooking)
        .filter(TicketBooking.user_id == current_user.id)
        .order_by(TicketBooking.created_at.desc())
        .all()
    )

    result = []
    for b in bookings:
        event = db.query(Event).filter(Event.id == b.event_id).first()
        tt = db.query(TicketType).filter(TicketType.id == b.ticket_type_id).first()
        result.append(
            {
                "id": b.id,
                "booking_ref": b.booking_ref,
                "event_id": b.event_id,
                "event_title": event.title if event else "Unknown",
                "event_date": event.event_date if event else None,
                "event_time": event.event_time if event else None,
                "venue": event.venue if event else "",
                "location": event.location if event else "",
                "image_url": event.image_url if event else None,
                "category": event.category if event else "",
                "ticket_name": tt.name if tt else "Unknown",
                "quantity": b.quantity,
                "unit_price": b.unit_price,
                "total_price": b.total_price,
                "payment_status": b.payment_status,
                "transaction_id": b.transaction_id,
                "card_last4": b.card_last4,
                "status": b.status,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
        )
    return result


@router.get("/event/{event_id}/attendees")
def get_event_attendees(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Not found")
    if event.organizer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not allowed")

    bookings = (
        db.query(TicketBooking)
        .filter(
            TicketBooking.event_id == event_id,
            TicketBooking.status != "cancelled",
        )
        .all()
    )

    result = []
    for b in bookings:
        attendee = db.query(User).filter(User.id == b.user_id).first()
        tt = db.query(TicketType).filter(TicketType.id == b.ticket_type_id).first()
        result.append(
            {
                "booking_ref": b.booking_ref,
                "attendee_name": attendee.full_name if attendee else "Unknown",
                "attendee_email": attendee.email if attendee else "",
                "ticket_name": tt.name if tt else "Unknown",
                "quantity": b.quantity,
                "total_price": b.total_price,
                "payment_status": b.payment_status,
                "status": b.status,
                "booked_at": b.created_at.isoformat() if b.created_at else None,
            }
        )

    total_revenue = sum(b.total_price for b in bookings)
    organizer_revenue = sum(b.organizer_amount for b in bookings)
    return {
        "attendees": result,
        "total_bookings": len(bookings),
        "total_revenue": total_revenue,
        "organizer_revenue": organizer_revenue,
        "commission": total_revenue - organizer_revenue,
    }


@router.patch("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(TicketBooking)
        .filter(
            TicketBooking.id == booking_id,
            TicketBooking.user_id == current_user.id,
        )
        .first()
    )
    if not booking:
        raise HTTPException(404, "Not found")

    booking.status = "cancelled"
    tt = (
        db.query(TicketType)
        .filter(TicketType.id == booking.ticket_type_id)
        .first()
    )
    if tt:
        tt.sold_count = max(0, tt.sold_count - booking.quantity)
    db.commit()
    return {"ok": True}
