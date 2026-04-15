from __future__ import annotations

from datetime import date, timedelta
from types import SimpleNamespace

import stripe

from app.models.booking import Booking
from app.models.loyalty import LoyaltyAccount
from app.models.loyalty import LoyaltyTransaction
from app.models.payment import Payment


def _create_booking(client, headers, listing_id: int):
    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=2)
    res = client.post(
        "/bookings/",
        headers=headers,
        json={
            "listing_id": listing_id,
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


def test_mock_payment_success(client, db_session, test_user, test_listing):
    booking = _create_booking(client, test_user["headers"], test_listing["id"])
    res = client.post(f"/payments/mock/confirm/{booking['id']}", headers=test_user["headers"], json={})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["message"].lower().startswith("payment successful")

    payment = db_session.query(Payment).filter(Payment.booking_id == booking["id"]).first()
    assert payment is not None
    assert payment.status == "completed"


def test_mock_payment_already_paid(client, test_user, test_listing):
    booking = _create_booking(client, test_user["headers"], test_listing["id"])
    first = client.post(f"/payments/mock/confirm/{booking['id']}", headers=test_user["headers"], json={})
    second = client.post(f"/payments/mock/confirm/{booking['id']}", headers=test_user["headers"], json={})
    assert first.status_code == 200
    assert second.status_code == 200
    assert "already confirmed" in second.json()["message"].lower()


def test_mock_payment_with_loyalty_points(client, db_session, test_user, test_listing):
    db_session.add(
        LoyaltyAccount(
            user_id=test_user["user"]["id"],
            total_points=60000,
            lifetime_points=60000,
            tier="silver",
        )
    )
    db_session.commit()

    booking = _create_booking(client, test_user["headers"], test_listing["id"])
    res = client.post(
        f"/payments/mock/confirm/{booking['id']}",
        headers=test_user["headers"],
        json={"loyalty_points_used": 50000},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["loyalty_points_used"] > 0
    assert data["loyalty_discount"] > 0

    redeem_txn = (
        db_session.query(LoyaltyTransaction)
        .filter(
            LoyaltyTransaction.user_id == test_user["user"]["id"],
            LoyaltyTransaction.reference_id == booking["id"],
            LoyaltyTransaction.transaction_type == "redeem",
        )
        .first()
    )
    assert redeem_txn is not None
    assert redeem_txn.points < 0


def test_stripe_create_session(client, monkeypatch, test_user, test_listing):
    booking = _create_booking(client, test_user["headers"], test_listing["id"])

    fake_session = SimpleNamespace(id="cs_test_123", url="https://checkout.stripe.test/session")
    monkeypatch.setattr("app.routers.stripe_payments.stripe.checkout.Session.create", lambda **kwargs: fake_session)

    res = client.post(
        "/payments/stripe/create-session",
        headers=test_user["headers"],
        json={"booking_id": booking["id"], "loyalty_points_used": 0, "addons": []},
    )
    assert res.status_code == 200, res.text
    assert res.json()["session_id"] == "cs_test_123"
    assert res.json()["checkout_url"].startswith("https://")


def test_stripe_webhook_signature(client, monkeypatch):
    def _raise_bad_signature(payload, sig, secret):
        raise stripe.error.SignatureVerificationError("Invalid signature", sig)

    monkeypatch.setattr("app.routers.stripe_payments.stripe.Webhook.construct_event", _raise_bad_signature)
    res = client.post(
        "/payments/stripe/webhook",
        data='{"id":"evt_fake","type":"checkout.session.completed"}',
        headers={"stripe-signature": "fake_signature"},
    )
    assert res.status_code == 400


def test_xpay_create_payment_intent_mocked(client, db_session, monkeypatch, test_user, test_listing):
    booking = _create_booking(client, test_user["headers"], test_listing["id"])

    hold = client.post(f"/payments/xpay/create-hold/{booking['id']}", headers=test_user["headers"])
    assert hold.status_code == 200, hold.text

    class DummyResponse:
        status_code = 200
        text = "ok"

        @staticmethod
        def raise_for_status():
            return None

        @staticmethod
        def json():
            return {"id": "xpay_txn_1", "iframe_url": "https://xpay.test/checkout/1"}

    monkeypatch.setattr("app.routers.xpay_payments.requests.post", lambda *args, **kwargs: DummyResponse())

    res = client.post(
        "/payments/xpay/create-payment-intent",
        headers=test_user["headers"],
        json={"booking_id": booking["id"], "addons": []},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["payment_id"] == "xpay_txn_1"
    assert data["iframe_url"].startswith("https://")

    booking_row = db_session.query(Booking).filter(Booking.id == booking["id"]).first()
    assert booking_row.status == "pending_payment"
