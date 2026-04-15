from __future__ import annotations

from datetime import date, timedelta

from app.models.booking import Booking


def test_create_addon(client, test_provider, test_listing):
    res = client.post(
        f"/listings/{test_listing['id']}/addons",
        headers=test_provider["headers"],
        json={
            "name": "Breakfast",
            "description": "Daily breakfast",
            "price": 500,
            "price_type": "per_night",
            "is_optional": True,
            "max_quantity": 2,
            "is_active": True,
            "sort_order": 1,
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["name"] == "Breakfast"
    assert data["price"] == 500


def test_addon_in_booking(client, db_session, test_user, test_provider, test_listing):
    addon_res = client.post(
        f"/listings/{test_listing['id']}/addons",
        headers=test_provider["headers"],
        json={
            "name": "Airport Pickup",
            "description": "One-time pickup",
            "price": 1000,
            "price_type": "per_booking",
            "is_optional": True,
            "max_quantity": 1,
            "is_active": True,
            "sort_order": 1,
        },
    )
    assert addon_res.status_code == 200, addon_res.text
    addon_id = addon_res.json()["id"]

    check_in = date.today() + timedelta(days=9)
    check_out = check_in + timedelta(days=2)
    booking = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": test_listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
        },
    )
    assert booking.status_code == 200, booking.text
    booking_id = booking.json()["id"]

    paid = client.post(
        f"/payments/mock/confirm/{booking_id}",
        headers=test_user["headers"],
        json={"addons": [{"id": addon_id, "quantity": 1}]},
    )
    assert paid.status_code == 200, paid.text
    assert paid.json()["amount"] == 21000

    booking_row = db_session.query(Booking).filter(Booking.id == booking_id).first()
    assert booking_row.addons
    assert booking_row.addons[0]["name"] == "Airport Pickup"
