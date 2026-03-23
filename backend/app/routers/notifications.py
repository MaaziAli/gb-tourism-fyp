from fastapi import (
    APIRouter, Depends, HTTPException,
    Request
)
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.notification import Notification
from ..dependencies.auth import get_current_user


router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationPrefs(BaseModel):
    booking: bool = True
    payment: bool = True
    review: bool = True
    success: bool = True
    system: bool = True


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
            if n.created_at
            else None,
        }
        for n in notifs
    ]


@router.get("/unread-count")
def get_unread_count(
    request: Request,
    db: Session = Depends(get_db),
):
    """Get unread notification count.
    Returns 0 if not authenticated."""
    try:
        # Manually check auth - don't fail
        auth_header = request.headers.get(
            "Authorization", ""
        )
        if not auth_header.startswith("Bearer "):
            return {"count": 0, "unread": 0}

        token = auth_header.split(" ")[1]
        from ..core.jwt import decode_access_token
        payload = decode_access_token(token)
        user_id = int(payload.get("sub", 0))
        if not user_id:
            return {"count": 0, "unread": 0}

        from ..models.notification import (
            Notification
        )
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        return {"count": count, "unread": count}
    except Exception:
        return {"count": 0, "unread": 0}


@router.get("/stats")
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    total = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .count()
    )
    unread = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    type_counts = (
        db.query(Notification.type, func.count(Notification.id))
        .filter(Notification.user_id == current_user.id)
        .group_by(Notification.type)
        .all()
    )

    return {
        "total": total,
        "unread": unread,
        "by_type": {t: c for t, c in type_counts},
    }


@router.delete("/clear-all")
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"ok": True, "cleared": True}


@router.get("/by-type/{type_name}")
def get_notifications_by_type(
    type_name: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notifs = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.type == type_name,
        )
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@router.patch("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    n = (
        db.query(Notification)
        .filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Not found")
    n.is_read = True
    db.commit()
    return {"ok": True}


@router.patch("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update({"is_read": True})
    )
    db.commit()
    return {"ok": True}


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    n = (
        db.query(Notification)
        .filter(
            Notification.id == notif_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(n)
    db.commit()
    return {"ok": True}

