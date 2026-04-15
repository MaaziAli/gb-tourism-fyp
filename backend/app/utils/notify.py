"""
Notification utility.

create_notification() stores an in-app Notification record and, when
caller supplies `email_type` + `background_tasks`, also sends an email
to the user asynchronously (never blocks the request, never raises).
"""
import logging
import os
from typing import Any, Dict, Optional

from fastapi import BackgroundTasks
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from ..models.notification import Notification

logger = logging.getLogger(__name__)

# ── Jinja2 template environment ───────────────────────────────────────────────

_TEMPLATE_DIR = os.path.join(
    os.path.dirname(__file__), "..", "templates", "emails"
)

_jinja_env = Environment(
    loader=FileSystemLoader(_TEMPLATE_DIR),
    autoescape=select_autoescape(["html"]),
)

# Maps email_type → template filename
_EMAIL_TEMPLATES: Dict[str, str] = {
    "booking_created":          "booking_confirmation_user.html",
    "booking_created_provider": "booking_confirmation_provider.html",
    "payment_success":          "payment_success.html",
    "booking_cancelled":        "booking_cancellation.html",
}


def render_email_template(email_type: str, context: Dict[str, Any]) -> str:
    """Render a Jinja2 email template; returns empty string on any error."""
    template_name = _EMAIL_TEMPLATES.get(email_type)
    if not template_name:
        logger.warning("Unknown email_type '%s' – no template found", email_type)
        return ""
    try:
        template = _jinja_env.get_template(template_name)
        return template.render(**context)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to render email template %s: %s", template_name, exc
        )
        return ""


# ── Public API ────────────────────────────────────────────────────────────────

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "info",
    *,
    email_type: Optional[str] = None,
    email_context: Optional[Dict[str, Any]] = None,
    background_tasks: Optional[BackgroundTasks] = None,
) -> None:
    """
    Persist an in-app notification and, optionally, send an email.

    Parameters
    ----------
    db               : SQLAlchemy session (already committed by caller is fine –
                       this function does its own commit for the Notification row).
    user_id          : Recipient's user ID.
    title            : Notification title (also used as the email subject).
    message          : Short notification body.
    type             : Notification type tag ("info", "success", "warning", …).
    email_type       : Key into _EMAIL_TEMPLATES; if None no email is sent.
    email_context    : Dict of template variables merged with defaults.
    background_tasks : FastAPI BackgroundTasks from the current request;
                       required for email to be sent.
    """
    # ── 1. Persist in-app notification ──────────────────────────────────────
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
    )
    db.add(notif)
    db.commit()

    # ── 2. Send email if requested ──────────────────────────────────────────
    if not (email_type and background_tasks):
        return

    # Lazy imports to avoid circular deps at module load time
    from ..models.user import User
    from ..config import settings
    from .email import send_email_background

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.email:
        return

    # Build context: caller-supplied values take precedence
    ctx: Dict[str, Any] = {
        "user_name":    user.full_name or user.email.split("@")[0],
        "frontend_url": settings.FRONTEND_URL,
    }
    if email_context:
        ctx.update(email_context)

    html = render_email_template(email_type, ctx)
    if html:
        send_email_background(background_tasks, user.email, title, html)
