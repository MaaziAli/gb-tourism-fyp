from __future__ import annotations

from datetime import date, timedelta

from tests.conftest import create_listing


def test_group_discount_rates_endpoint(client):
    res = client.get("/group-bookings/discount-rates")
    assert res.status_code == 200
    data = res.json()
    assert any(t["min_persons"] == 5 and t["discount_percent"] == 5 for t in data)


def test_group_calculate_price(client, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Group Tour",
        location="Skardu",
        price_per_night=4000,
        service_type="tour",
        rooms_available=5,
    )
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)

    res = client.post(
        "/group-bookings/calculate",
        json={
            "listing_id": listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "group_size": 10,
            "apply_group_discount": True,
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["discount_rate"] >= 10
    assert data["total_price"] < data["base_price"]
    assert data["price_per_person"] > 0


def test_group_booking_creation(client, test_user, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Group Hotel",
        location="Hunza",
        price_per_night=12000,
        service_type="hotel",
        rooms_available=10,
    )
    check_in = date.today() + timedelta(days=14)
    check_out = check_in + timedelta(days=3)
    res = client.post(
        "/group-bookings/book",
        headers=test_user["headers"],
        json={
            "listing_id": listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "group_size": 6,
            "group_lead_name": "Lead Person",
            "special_requirements": "High floor",
            "apply_group_discount": True,
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "confirmed"
    assert data["group_size"] == 6
    assert data["discount_rate"] >= 5
    assert data["total_price"] > 0
