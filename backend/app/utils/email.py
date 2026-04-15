"""
Email sending utility.

Supports two providers, selected via EMAIL_PROVIDER env var:
  - "resend"  (default) – uses the Resend API (pip install resend)
  - "smtp"              – plain STARTTLS SMTP (e.g. Gmail app password)

All public functions are fire-and-forget: errors are logged, never raised,
so a mail failure can never break a booking or payment flow.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)


# ── Internal send helpers ────────────────────────────────────────────────────

def _send_via_resend(to: str, subject: str, html: str, from_addr: str) -> None:
    """Send using the Resend HTTP API.  Requires `pip install resend`."""
    try:
        import resend as _resend
    except ImportError as exc:
        raise RuntimeError(
            "resend package not installed. Run: pip install resend"
        ) from exc

    from app.config import settings  # local import avoids circular dependency

    _resend.api_key = settings.RESEND_API_KEY
    _resend.Emails.send(
        {
            "from": from_addr,
            "to": to,
            "subject": subject,
            "html": html,
        }
    )


def _send_via_smtp(
    to: str,
    subject: str,
    html: str,
    text: Optional[str],
    from_addr: str,
    host: str,
    port: int,
    user: str,
    password: str,
) -> None:
    """Send via STARTTLS SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to

    if text:
        msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.login(user, password)
        server.sendmail(from_addr, [to], msg.as_string())


# ── Public API ───────────────────────────────────────────────────────────────

def send_email_sync(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
) -> None:
    """
    Send an email synchronously.

    Never raises – any exception is caught and logged so the caller's
    booking / payment transaction is never affected.
    """
    # Imported here so we don't create a circular dependency at module load time
    from app.config import settings

    if not settings.EMAIL_ENABLED:
        logger.debug("Emails disabled – skipping send to %s (%s)", to, subject)
        return

    if not to or "@" not in to:
        logger.warning("Invalid recipient address '%s' – skipping email", to)
        return

    try:
        if settings.EMAIL_PROVIDER == "resend":
            _send_via_resend(to, subject, html, settings.EMAIL_FROM)
        else:
            _send_via_smtp(
                to=to,
                subject=subject,
                html=html,
                text=text,
                from_addr=settings.EMAIL_FROM,
                host=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                user=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
            )
        logger.info("Email sent  to=%s  subject=%r", to, subject)
    except Exception as exc:  # noqa: BLE001
        logger.error("Email FAILED  to=%s  subject=%r  error=%s", to, subject, exc)


def send_email_background(
    background_tasks: BackgroundTasks,
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
) -> None:
    """Queue an email to be sent asynchronously via FastAPI BackgroundTasks."""
    background_tasks.add_task(send_email_sync, to, subject, html, text)
