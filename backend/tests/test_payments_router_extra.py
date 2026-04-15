from __future__ import annotations

from datetime import date, timedelta

from app.models.loyalty import LoyaltyAccount


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


def test_payments_apply_loyalty_process_and_views(client, db_session, test_user, test_provider, test_admin, test_listing):
    db_session.add(
        LoyaltyAccount(
            user_id=test_user["user"]["id"],
            total_points=100000,
            lifetime_points=100000,
            tier="silver",
        )
    )
    db_session.commit()

    booking = _create_booking(client, test_user["headers"], test_listing["id"])

    apply_points = client.post(
        "/payments/apply-loyalty",
        headers=test_user["headers"],
        json={"booking_id": booking["id"], "points": 50000},
    )
    assert apply_points.status_code == 200
    assert apply_points.json()["discount_amount"] > 0

    pay = client.post(
        "/payments/process",
        headers=test_user["headers"],
        json={
            "booking_id": booking["id"],
            "payment_method": "card",
            "card_number": "4242424242424242",
            "card_expiry": "12/29",
            "card_cvv": "123",
            "card_name": "Tester",
        },
    )
    assert pay.status_code == 200, pay.text

    booking_payment = client.get(f"/payments/booking/{booking['id']}", headers=test_user["headers"])
    assert booking_payment.status_code == 200
    assert booking_payment.json()["paid"] is True

    my_spending = client.get("/payments/my-spending", headers=test_user["headers"])
    assert my_spending.status_code == 200
    assert my_spending.json()["total_spent"] > 0

    provider_received = client.get("/payments/provider-received", headers=test_provider["headers"])
    assert provider_received.status_code == 200
    assert "payments" in provider_received.json()

    admin_summary = client.get("/payments/admin/summary", headers=test_admin["headers"])
    assert admin_summary.status_code == 200
    assert admin_summary.json()["total_payments"] >= 1

    admin_all = client.get("/payments/admin/all-payments", headers=test_admin["headers"])
    assert admin_all.status_code == 200
    assert admin_all.json()["total_transactions"] >= 1
