from __future__ import annotations

from tests.conftest import create_listing


def test_rooms_crud_and_availability_update(client, test_provider):
    hotel = create_listing(
        client,
        token=test_provider["token"],
        title="Room Hotel",
        location="Gilgit",
        price_per_night=10000,
        service_type="hotel",
        rooms_available=10,
    )

    create = client.post(
        f"/rooms/hotel/{hotel['id']}",
        headers=test_provider["headers"],
        data={
            "room_type": "Deluxe",
            "description": "Sea view",
            "price_per_night": "12000",
            "capacity": "3",
            "bed_type": "King",
            "total_rooms": "5",
            "available_rooms": "5",
            "amenities": '["wifi","ac"]',
            "breakfast_included": "true",
        },
    )
    assert create.status_code == 200, create.text
    room_id = create.json()["id"]
    assert create.json()["available_rooms"] == 5

    listed = client.get(f"/rooms/hotel/{hotel['id']}")
    assert listed.status_code == 200
    assert any(r["id"] == room_id for r in listed.json())

    one = client.get(f"/rooms/{room_id}")
    assert one.status_code == 200
    assert one.json()["name"] == "Deluxe"

    updated = client.put(
        f"/rooms/{room_id}",
        headers=test_provider["headers"],
        data={
            "room_type": "Deluxe Plus",
            "description": "Updated",
            "price_per_night": "13000",
            "capacity": "4",
            "bed_type": "King",
            "total_rooms": "6",
            "available_rooms": "4",
            "amenities": '["wifi"]',
            "breakfast_included": "false",
        },
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Deluxe Plus"

    patch_avail = client.patch(
        f"/rooms/{room_id}/availability",
        headers=test_provider["headers"],
        params={"available_rooms": 3},
    )
    assert patch_avail.status_code == 200
    assert patch_avail.json()["available_rooms"] == 3

    invalid_avail = client.patch(
        f"/rooms/{room_id}/availability",
        headers=test_provider["headers"],
        params={"available_rooms": 99},
    )
    assert invalid_avail.status_code == 400

    deleted = client.delete(f"/rooms/{room_id}", headers=test_provider["headers"])
    assert deleted.status_code == 204
