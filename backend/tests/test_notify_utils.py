from __future__ import annotations

from app.models.notification import Notification
from app.utils import notify as notify_utils


def test_render_email_template_known_and_unknown(monkeypatch):
    class DummyTemplate:
        @staticmethod
        def render(**ctx):
            return f"hello {ctx.get('user_name', 'user')}"

    class DummyEnv:
        @staticmethod
        def get_template(name):
            assert name.endswith(".html")
            return DummyTemplate()

    monkeypatch.setattr("app.utils.notify._jinja_env", DummyEnv())

    rendered = notify_utils.render_email_template("booking_created", {"user_name": "Ali"})
    assert "Ali" in rendered

    unknown = notify_utils.render_email_template("nonexistent_type", {"user_name": "Ali"})
    assert unknown == ""


def test_create_notification_persists_and_queues_email(client, db_session, monkeypatch, test_user):
    queued = {"called": False}

    def _fake_send_email_background(background_tasks, to, subject, html):
        queued["called"] = True
        assert "@" in to
        assert subject == "Booking Confirmed"
        assert html

    monkeypatch.setattr("app.utils.email.send_email_background", _fake_send_email_background)
    monkeypatch.setattr("app.utils.notify.render_email_template", lambda email_type, context: "<p>ok</p>")

    class DummyBackground:
        def add_task(self, fn, *args):
            fn(*args)

    notify_utils.create_notification(
        db_session,
        user_id=test_user["user"]["id"],
        title="Booking Confirmed",
        message="Your booking is ready",
        type="success",
        email_type="booking_created",
        email_context={"booking_id": 123},
        background_tasks=DummyBackground(),
    )

    rows = (
        db_session.query(Notification)
        .filter(Notification.user_id == test_user["user"]["id"])
        .all()
    )
    assert len(rows) >= 1
    assert any(r.title == "Booking Confirmed" for r in rows)
    assert queued["called"] is True
