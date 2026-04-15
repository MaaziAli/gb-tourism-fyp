from __future__ import annotations

from datetime import date, timedelta


def test_hotels_crud_and_bookings_view(client, test_provider, test_user):
    created = client.post(
        "/hotels/",
        headers=test_provider["headers"],
        data={
            "name": "Hotel Router",
            "location": "Hunza",
            "description": "Nice place",
            "amenities": '["wifi"]',
            "price": "9500",
            "cancellation_policy": "moderate",
            "rooms_available": "8",
        },
    )
    assert created.status_code == 200, created.text
    hotel_id = created.json()["id"]

    listing = client.get("/hotels/", params={"q": "Hotel", "location": "Hunza", "sort_by": "rating"})
    assert listing.status_code == 200
    assert any(h["id"] == hotel_id for h in listing.json())

    detail = client.get(f"/hotels/{hotel_id}")
    assert detail.status_code == 200
    assert detail.json()["id"] == hotel_id

    updated = client.put(
        f"/hotels/{hotel_id}",
        headers=test_provider["headers"],
        data={
            "name": "Hotel Router Updated",
            "location": "Hunza Valley",
            "description": "Updated",
            "amenities": '["wifi","spa"]',
            "price": "10000",
            "cancellation_policy": "flexible",
            "rooms_available": "10",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Hotel Router Updated"

    check_in = date.today() + timedelta(days=8)
    check_out = check_in + timedelta(days=2)
    booking = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": hotel_id,
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
        },
    )
    assert booking.status_code == 200, booking.text

    hotel_bookings = client.get(f"/hotels/{hotel_id}/bookings", headers=test_provider["headers"])
    assert hotel_bookings.status_code == 200
    assert len(hotel_bookings.json()) >= 1

    # Active booking should block delete.
    blocked_delete = client.delete(f"/hotels/{hotel_id}", headers=test_provider["headers"])
    assert blocked_delete.status_code == 400
