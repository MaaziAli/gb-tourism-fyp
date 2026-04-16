import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

ADMIN_NOTIFY_EMAIL = "maazalisshahid@gmail.com"


def send_admin_notification_email(subject: str, body_html: str) -> None:
    """
    Sends an email notification to the admin personal email.
    Uses environment variables for SMTP config.
    Falls back silently if SMTP is not configured (development mode).

    Required environment variables:
      SMTP_HOST     — e.g. smtp.gmail.com
      SMTP_PORT     — e.g. 587
      SMTP_USER     — sender Gmail address
      SMTP_PASSWORD — Gmail App Password (NOT regular password)
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"[email] SMTP not configured — skipping email: {subject}")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = ADMIN_NOTIFY_EMAIL
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, ADMIN_NOTIFY_EMAIL, msg.as_string())
        print(f"[email] Sent to {ADMIN_NOTIFY_EMAIL}: {subject}")
    except Exception as e:
        print(f"[email] Failed to send email: {e}")
        # Never raise — email failure must not break the API response

