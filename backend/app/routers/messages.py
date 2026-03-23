from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..dependencies.auth import get_current_user

router = APIRouter(
    prefix="/messages", tags=["Messages"]
)


class MessageCreate(BaseModel):
    receiver_id: int
    listing_id: int
    booking_id: Optional[int] = None
    message: str


@router.get("/unread-count")
def get_unread_count(
    request: Request,
    db: Session = Depends(get_db),
):
    """Returns 0 if not authenticated"""
    try:
        auth_header = request.headers.get(
            "Authorization", ""
        )
        if not auth_header.startswith("Bearer "):
            return {"unread": 0}

        token = auth_header.split(" ")[1]
        from ..core.jwt import decode_access_token
        payload = decode_access_token(token)
        user_id = int(payload.get("sub", 0))
        if not user_id:
            return {"unread": 0}

        from ..models.message import Message
        count = db.query(Message).filter(
            Message.receiver_id == user_id,
            Message.is_read == False
        ).count()
        return {"unread": count}
    except Exception:
        return {"unread": 0}


@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        from ..models.message import Message
        from ..models.user import User
        from ..models.listing import Listing
        from sqlalchemy import or_

        all_msgs = db.query(Message).filter(
            or_(
                Message.sender_id ==
                    current_user.id,
                Message.receiver_id ==
                    current_user.id
            )
        ).order_by(
            Message.created_at.desc()
        ).all()

        seen = set()
        conversations = []
        for msg in all_msgs:
            other_id = (
                msg.receiver_id
                if msg.sender_id == current_user.id
                else msg.sender_id
            )
            key = (other_id, msg.listing_id)
            if key in seen:
                continue
            seen.add(key)

            other = db.query(User).filter(
                User.id == other_id
            ).first()
            listing = db.query(Listing).filter(
                Listing.id == msg.listing_id
            ).first()

            unread = db.query(Message).filter(
                Message.sender_id == other_id,
                Message.receiver_id ==
                    current_user.id,
                Message.listing_id ==
                    msg.listing_id,
                Message.is_read == False
            ).count()

            conversations.append({
                "other_user_id": other_id,
                "other_user_name":
                    other.full_name
                    if other else "Unknown",
                "listing_id": msg.listing_id,
                "listing_title": listing.title
                    if listing else "Unknown",
                "last_message": msg.message[:60],
                "last_at":
                    msg.created_at.isoformat()
                    if msg.created_at else None,
                "unread_count": unread
            })
        return conversations
    except Exception as e:
        print(f"Conversations error: {e}")
        return []


@router.post("/send")
def send_message(
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        from ..models.message import Message
        from ..models.listing import Listing

        listing = db.query(Listing).filter(
            Listing.id == body.listing_id
        ).first()
        if not listing:
            raise HTTPException(
                404, "Listing not found"
            )

        if not body.message.strip():
            raise HTTPException(
                400, "Message cannot be empty"
            )

        msg = Message(
            sender_id=current_user.id,
            receiver_id=body.receiver_id,
            listing_id=body.listing_id,
            booking_id=body.booking_id,
            message=body.message.strip(),
            is_read=False
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        try:
            from ..utils.notify import (
                create_notification
            )
            create_notification(
                db,
                user_id=body.receiver_id,
                title=f"💬 New message from "
                      f"{current_user.full_name}",
                message=body.message[:80],
                type="info"
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
            "created_at":
                msg.created_at.isoformat()
                if msg.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            500, f"Failed to send: {str(e)}"
        )


@router.get(
    "/thread/{listing_id}/{other_user_id}"
)
def get_thread(
    listing_id: int,
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        from ..models.message import Message
        from ..models.user import User
        from sqlalchemy import or_, and_

        msgs = db.query(Message).filter(
            Message.listing_id == listing_id,
            or_(
                and_(
                    Message.sender_id ==
                        current_user.id,
                    Message.receiver_id ==
                        other_user_id
                ),
                and_(
                    Message.sender_id ==
                        other_user_id,
                    Message.receiver_id ==
                        current_user.id
                )
            )
        ).order_by(
            Message.created_at.asc()
        ).all()

        for m in msgs:
            if m.receiver_id == current_user.id \
               and not m.is_read:
                m.is_read = True
        db.commit()

        other = db.query(User).filter(
            User.id == other_user_id
        ).first()

        return {
            "messages": [
                {
                    "id": m.id,
                    "sender_id": m.sender_id,
                    "receiver_id": m.receiver_id,
                    "message": m.message,
                    "is_read": bool(m.is_read),
                    "is_mine": m.sender_id ==
                        current_user.id,
                    "created_at":
                        m.created_at.isoformat()
                        if m.created_at else None
                }
                for m in msgs
            ],
            "other_user": {
                "id": other_user_id,
                "name": other.full_name
                    if other else "Unknown"
            }
        }
    except Exception as e:
        print(f"Thread error: {e}")
        return {
            "messages": [],
            "other_user": {
                "id": other_user_id,
                "name": "Unknown"
            }
        }
