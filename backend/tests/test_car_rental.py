from __future__ import annotations

from datetime import date, timedelta

from tests.conftest import create_listing


def test_car_rental_fields_in_listing(client, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Car Listing",
        location="Skardu",
        price_per_night=4500,
        service_type="car_rental",
        rooms_available=1,
    )

    update = client.put(
        f"/listings/{listing['id']}",
        headers=test_provider["headers"],
        data={
            "title": "Car Listing",
            "location": "Skardu",
            "price_per_night": "4500",
            "service_type": "car_rental",
            "description": "SUV",
            "amenities": "[]",
            "cancellation_policy": "moderate",
            "cancellation_hours_free": "48",
            "rooms_available": "1",
            "pickup_location": "Airport",
            "dropoff_location": "City Center",
            "pickup_time": "10:00",
            "dropoff_time": "18:00",
            "insurance_options": '[{"name":"premium","price_per_day":800}]',
            "fuel_policy": "full_to_full",
            "mileage_limit": "250",
        },
    )
    assert update.status_code == 200, update.text

    detail = client.get(f"/listings/{listing['id']}")
    assert detail.status_code == 200
    data = detail.json()
    assert data["pickup_location"] == "Airport"
    assert data["dropoff_location"] == "City Center"
    assert data["fuel_policy"] == "full_to_full"


def test_car_rental_booking_with_insurance(client, test_user, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Jeep Rental",
        location="Hunza",
        price_per_night=5000,
        service_type="car_rental",
        rooms_available=1,
    )
    update = client.put(
        f"/listings/{listing['id']}",
        headers=test_provider["headers"],
        data={
            "title": "Jeep Rental",
            "location": "Hunza",
            "price_per_night": "5000",
            "service_type": "car_rental",
            "description": "4x4",
            "amenities": "[]",
            "cancellation_policy": "moderate",
            "cancellation_hours_free": "48",
            "rooms_available": "1",
            "pickup_location": "Main Bazaar",
            "dropoff_location": "Main Bazaar",
            "pickup_time": "09:00",
            "dropoff_time": "18:00",
            "insurance_options": '[{"name":"standard","price_per_day":300}]',
            "fuel_policy": "full_to_full",
            "mileage_limit": "200",
        },
    )
    assert update.status_code == 200, update.text

    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=3)
    booking = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
            "rental_details": {"selected_insurance": ["standard"]},
        },
    )
    assert booking.status_code == 200, booking.text
    data = booking.json()
    # base: 5000*3 = 15000, insurance: 300*3 = 900
    assert data["total_price"] == 15900
