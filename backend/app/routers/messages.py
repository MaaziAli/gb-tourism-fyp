from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, or_, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.listing import Listing
from app.models.message import Message
from app.models.user import User

router = APIRouter(prefix="/messages", tags=["Messages"])


class MessageCreate(BaseModel):
    receiver_id: int
    listing_id: int
    booking_id: int | None = None
    message: str


class ReplyCreate(BaseModel):
    message: str


@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all unique conversations."""
    result = db.execute(
        text(
            """
        SELECT DISTINCT
            CASE
                WHEN sender_id = :uid
                THEN receiver_id
                ELSE sender_id
            END as other_id,
            listing_id,
            MAX(created_at) as last_at,
            SUM(CASE WHEN is_read=0
                AND receiver_id=:uid
                THEN 1 ELSE 0 END) as unread
        FROM messages
        WHERE sender_id = :uid
           OR receiver_id = :uid
        GROUP BY other_id, listing_id
        ORDER BY last_at DESC
        """
        ),
        {"uid": current_user.id},
    )

    rows = result.fetchall()
    conversations = []
    for row in rows:
        other = db.query(User).filter(User.id == row[0]).first()
        listing = db.query(Listing).filter(Listing.id == row[1]).first()
        conversations.append(
            {
                "other_user_id": row[0],
                "other_user_name": other.full_name if other else "Unknown",
                "listing_id": row[1],
                "listing_title": listing.title if listing else "Unknown",
                "last_at": row[2],
                "unread_count": int(row[3] or 0),
            }
        )
    return conversations


@router.get("/thread/{listing_id}/{other_user_id}")
def get_thread(
    listing_id: int,
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msgs = (
        db.query(Message)
        .filter(
            Message.listing_id == listing_id,
            or_(
                and_(
                    Message.sender_id == current_user.id,
                    Message.receiver_id == other_user_id,
                ),
                and_(
                    Message.sender_id == other_user_id,
                    Message.receiver_id == current_user.id,
                ),
            ),
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    for m in msgs:
        if m.receiver_id == current_user.id:
            m.is_read = True
    db.commit()

    other = db.query(User).filter(User.id == other_user_id).first()

    return {
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "receiver_id": m.receiver_id,
                "message": m.message,
                "is_read": bool(m.is_read),
                "is_mine": m.sender_id == current_user.id,
                "created_at": m.created_at.isoformat()
                if m.created_at
                else None,
            }
            for m in msgs
        ],
        "other_user": {
            "id": other_user_id,
            "name": other.full_name if other else "Unknown",
        },
    }


@router.post("/send")
def send_message(
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(Listing.id == body.listing_id).first()
    if not listing:
        raise HTTPException(404, "Listing not found")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=body.receiver_id,
        listing_id=body.listing_id,
        booking_id=body.booking_id,
        message=body.message.strip(),
        is_read=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    try:
        from app.utils.notify import create_notification

        create_notification(
            db,
            user_id=body.receiver_id,
            title=f"New message from {current_user.full_name}",
            message=body.message[:100]
            + ("..." if len(body.message) > 100 else ""),
            type="info",
        )
    except Exception:
        pass

    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "message": msg.message,
        "is_read": False,
        "is_mine": True,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Message)
        .filter(
            Message.receiver_id == current_user.id,
            Message.is_read.is_(False),
        )
        .count()
    )
    return {"unread": count}
