from __future__ import annotations

from app.utils import email as email_utils


def test_send_email_sync_resend_provider(monkeypatch):
    monkeypatch.setattr("app.config.settings.EMAIL_ENABLED", True)
    monkeypatch.setattr("app.config.settings.EMAIL_PROVIDER", "resend")
    monkeypatch.setattr("app.config.settings.EMAIL_FROM", "noreply@test.com")
    sent = {"called": False}

    def _fake_resend(to, subject, html, from_addr):
        sent["called"] = True
        assert to == "a@test.com"
        assert from_addr == "noreply@test.com"

    monkeypatch.setattr("app.utils.email._send_via_resend", _fake_resend)
    email_utils.send_email_sync("a@test.com", "Subject", "<b>hello</b>")
    assert sent["called"] is True


def test_send_email_sync_smtp_provider(monkeypatch):
    monkeypatch.setattr("app.config.settings.EMAIL_ENABLED", True)
    monkeypatch.setattr("app.config.settings.EMAIL_PROVIDER", "smtp")
    monkeypatch.setattr("app.config.settings.EMAIL_FROM", "noreply@test.com")
    monkeypatch.setattr("app.config.settings.SMTP_HOST", "smtp.test")
    monkeypatch.setattr("app.config.settings.SMTP_PORT", 587)
    monkeypatch.setattr("app.config.settings.SMTP_USER", "user")
    monkeypatch.setattr("app.config.settings.SMTP_PASSWORD", "pass")
    sent = {"called": False}

    def _fake_smtp(**kwargs):
        sent["called"] = True
        assert kwargs["to"] == "b@test.com"
        assert kwargs["host"] == "smtp.test"

    monkeypatch.setattr("app.utils.email._send_via_smtp", _fake_smtp)
    email_utils.send_email_sync("b@test.com", "Subject", "<b>hello</b>", "plain")
    assert sent["called"] is True


def test_send_email_sync_invalid_recipient_and_disabled(monkeypatch):
    monkeypatch.setattr("app.config.settings.EMAIL_ENABLED", False)
    # Should silently return.
    email_utils.send_email_sync("invalid", "S", "<p>x</p>")


def test_send_email_background_queues_task():
    calls = {"args": None}

    class DummyBackground:
        def add_task(self, fn, *args):
            calls["args"] = (fn, args)

    bg = DummyBackground()
    email_utils.send_email_background(bg, "c@test.com", "Subj", "<p>x</p>", "txt")
    assert calls["args"] is not None
    assert calls["args"][1][0] == "c@test.com"
