from __future__ import annotations

from datetime import date, timedelta

from app.models.booking import Booking
from app.models.loyalty import LoyaltyAccount


def test_earn_points_on_booking(client, db_session, test_user, test_listing):
    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=2)
    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": test_listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
        },
    )
    assert res.status_code == 200, res.text

    account = (
        db_session.query(LoyaltyAccount).filter(LoyaltyAccount.user_id == test_user["user"]["id"]).first()
    )
    assert account is not None
    assert account.total_points > 0


def test_redeem_points_calculation(client, db_session, test_user):
    db_session.add(
        LoyaltyAccount(
            user_id=test_user["user"]["id"],
            total_points=900000,
            lifetime_points=900000,
            tier="platinum",
        )
    )
    db_session.commit()

    res = client.post(
        "/loyalty/calculate-redeem",
        headers=test_user["headers"],
        json={"points": 800000, "booking_amount": 1000},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["discount_amount"] == 500
    assert data["final_amount"] == 500
    assert data["points_to_use"] == 500000


def test_redeem_points_atomic(client, db_session, monkeypatch, test_user, test_listing):
    db_session.add(
        LoyaltyAccount(
            user_id=test_user["user"]["id"],
            total_points=200000,
            lifetime_points=200000,
            tier="gold",
        )
    )
    db_session.commit()

    def _raise_value_error(*args, **kwargs):
        raise ValueError("forced loyalty failure")

    monkeypatch.setattr("app.routers.bookings.redeem_points_transactional", _raise_value_error)

    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": test_listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
            "loyalty_points_used": 50000,
        },
    )
    assert res.status_code == 400
    assert "forced loyalty failure" in res.json()["detail"]

    # Atomicity check: booking should not persist when redemption fails.
    booking = db_session.query(Booking).filter(Booking.user_id == test_user["user"]["id"]).first()
    assert booking is None

    account = (
        db_session.query(LoyaltyAccount).filter(LoyaltyAccount.user_id == test_user["user"]["id"]).first()
    )
    assert account.total_points == 200000
