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
    check_out = check_in

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
    assert data["nights"] == 1
    assert data["units_needed"] == 10
    assert data["unit_label"] == "person"


def test_group_calculate_price_single_date_range_rejected(client, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Range Rejected Tour",
        location="Skardu",
        price_per_night=5000,
        service_type="tour",
        rooms_available=5,
    )
    check_in = date.today() + timedelta(days=8)
    check_out = check_in + timedelta(days=1)

    res = client.post(
        "/group-bookings/calculate",
        json={
            "listing_id": listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "group_size": 5,
            "apply_group_discount": True,
        },
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "For tours, check-out must equal check-in."


def test_group_calculate_price_discount_tiers_single_date(client, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Tiered Tour",
        location="Skardu",
        price_per_night=5000,
        service_type="tour",
        rooms_available=5,
    )
    check_in = date.today() + timedelta(days=11)
    check_date = check_in.isoformat()

    res_group_5 = client.post(
        "/group-bookings/calculate",
        json={
            "listing_id": listing["id"],
            "check_in": check_date,
            "check_out": check_date,
            "group_size": 5,
            "apply_group_discount": True,
        },
    )
    assert res_group_5.status_code == 200, res_group_5.text
    data_group_5 = res_group_5.json()
    assert data_group_5["base_price"] == 25000
    assert data_group_5["discount_rate"] == 5
    assert data_group_5["total_price"] == 23750

    res_group_1 = client.post(
        "/group-bookings/calculate",
        json={
            "listing_id": listing["id"],
            "check_in": check_date,
            "check_out": check_date,
            "group_size": 1,
            "apply_group_discount": True,
        },
    )
    assert res_group_1.status_code == 200, res_group_1.text
    data_group_1 = res_group_1.json()
    assert data_group_1["base_price"] == 5000
    assert data_group_1["discount_rate"] == 0
    assert data_group_1["total_price"] == 5000


def test_group_booking_single_date_sets_price_per_person(client, test_user, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="People Tour",
        location="Hunza",
        price_per_night=5000,
        service_type="tour",
        rooms_available=10,
    )
    check_in = date.today() + timedelta(days=12)
    check_date = check_in.isoformat()

    res = client.post(
        "/group-bookings/book",
        headers=test_user["headers"],
        json={
            "listing_id": listing["id"],
            "check_in": check_date,
            "check_out": check_date,
            "group_size": 5,
            "group_lead_name": "Tour Lead",
            "apply_group_discount": True,
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "confirmed"
    assert data["nights"] == 1
    assert data["discount_rate"] == 5
    assert data["total_price"] == 23750
    assert data["price_per_person"] == 4750


def test_group_booking_single_date_range_rejected(client, test_user, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Invalid Tour Range",
        location="Hunza",
        price_per_night=4800,
        service_type="tour",
        rooms_available=8,
    )
    check_in = date.today() + timedelta(days=15)
    check_out = check_in + timedelta(days=1)

    res = client.post(
        "/group-bookings/book",
        headers=test_user["headers"],
        json={
            "listing_id": listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "group_size": 4,
            "group_lead_name": "Invalid Lead",
            "apply_group_discount": True,
        },
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "For tours, check-out must equal check-in."


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
