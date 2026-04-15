"""
Shared webhook utilities for idempotency, logging, and exception classification.

Usage in any webhook endpoint:

    from app.utils.webhook_utils import (
        is_event_processed,
        mark_event_processed,
        classify_exception,
        WebhookSource,
    )

    if is_event_processed(db, event_id):
        return {"status": "already_processed"}

    try:
        # ... your processing logic ...
        mark_event_processed(db, event_id, event_type, source=WebhookSource.STRIPE)
    except Exception as exc:
        if classify_exception(exc) == "transient":
            raise HTTPException(status_code=500, detail="Transient error — please retry")
        logger.exception("Permanent webhook error: %s", exc)
        return {"status": "error_logged"}
"""
import logging
from datetime import datetime
from typing import Literal

from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from app.models.webhook_event import WebhookEvent

logger = logging.getLogger(__name__)


class WebhookSource:
    STRIPE = "stripe"
    XPAY = "xpay"


ExceptionKind = Literal["transient", "permanent"]


# ── Idempotency helpers ───────────────────────────────────────────────────────


def is_event_processed(db: Session, event_id: str) -> bool:
    """Return True if this event_id was already successfully processed."""
    return (
        db.query(WebhookEvent)
        .filter(WebhookEvent.event_id == event_id)
        .first()
        is not None
    )


def mark_event_processed(
    db: Session,
    event_id: str,
    event_type: str,
    source: str = "unknown",
) -> None:
    """
    Persist a processed event record.

    A unique constraint on event_id means a concurrent duplicate write will
    raise IntegrityError — the caller should treat that as "already processed"
    and return 200 rather than propagating the error.
    """
    record = WebhookEvent(
        event_id=event_id,
        event_type=event_type,
        source=source,
        processed_at=datetime.utcnow(),
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        # Race condition: another request wrote the same event_id first.
        db.rollback()
        logger.info(
            "webhook_utils: duplicate write for event_id=%s (race condition, safe to ignore)",
            event_id,
        )


# ── Exception classification ──────────────────────────────────────────────────


def classify_exception(exc: Exception) -> ExceptionKind:
    """
    Decide whether an exception is transient (retry) or permanent (log & ack).

    Transient  → return HTTP 500 so Stripe/XPay will retry with back-off.
    Permanent  → return HTTP 200 so the provider stops retrying; error is logged.

    Rules
    -----
    - Database connectivity / lock errors     → transient
    - Application logic errors (bad data)     → permanent
    - Unknown exceptions                      → transient (fail safe: prefer retry)
    """
    # SQLAlchemy DB-level failures (connectivity, deadlock, pool timeout)
    if isinstance(exc, OperationalError):
        return "transient"

    # Application-layer errors that won't fix themselves on retry
    if isinstance(exc, (ValueError, KeyError, TypeError, AttributeError)):
        return "permanent"

    # Default: assume transient so the provider retries and we investigate
    return "transient"


# ── Structured log helpers ────────────────────────────────────────────────────


def log_webhook_received(
    source: str,
    event_id: str,
    event_type: str,
    extra: dict | None = None,
) -> None:
    logger.info(
        "webhook received | source=%s event_id=%s event_type=%s%s",
        source,
        event_id,
        event_type,
        f" | {extra}" if extra else "",
    )


def log_webhook_processed(source: str, event_id: str, event_type: str) -> None:
    logger.info(
        "webhook processed | source=%s event_id=%s event_type=%s",
        source,
        event_id,
        event_type,
    )


def log_webhook_skipped(source: str, event_id: str, reason: str) -> None:
    logger.info(
        "webhook skipped | source=%s event_id=%s reason=%s",
        source,
        event_id,
        reason,
    )


def log_webhook_error(
    source: str,
    event_id: str,
    event_type: str,
    exc: Exception,
    kind: ExceptionKind,
) -> None:
    logger.exception(
        "webhook error | source=%s event_id=%s event_type=%s kind=%s error=%s",
        source,
        event_id,
        event_type,
        kind,
        exc,
    )
