from __future__ import annotations


def _create_event(client, headers, title="Spring Fest"):
    res = client.post(
        "/events/",
        headers=headers,
        json={
            "title": title,
            "description": "Annual event",
            "category": "Local Festival & Fair",
            "venue": "Ground A",
            "location": "Skardu",
            "event_date": "2026-06-20",
            "event_time": "18:00",
            "end_time": "22:00",
            "total_capacity": 120,
            "is_free": False,
            "ticket_types": [
                {
                    "name": "General",
                    "description": "Gen",
                    "price": 500,
                    "capacity": 100,
                    "is_free": False,
                }
            ],
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


def test_event_crud_and_ticket_type_flow(client, test_provider):
    created = _create_event(client, test_provider["headers"])
    event_id = created["id"]
    assert created["title"] == "Spring Fest"
    assert len(created["ticket_types"]) >= 1

    list_public = client.get("/events/")
    assert list_public.status_code == 200
    assert any(e["id"] == event_id for e in list_public.json())

    detail = client.get(f"/events/{event_id}")
    assert detail.status_code == 200
    assert detail.json()["id"] == event_id

    update = client.put(
        f"/events/{event_id}",
        headers=test_provider["headers"],
        json={"title": "Spring Fest Updated", "venue": "Ground B"},
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Spring Fest Updated"

    add_ticket = client.post(
        f"/events/{event_id}/ticket-types",
        headers=test_provider["headers"],
        json={
            "name": "VIP",
            "description": "VIP access",
            "price": 1500,
            "capacity": 20,
            "is_free": False,
        },
    )
    assert add_ticket.status_code == 200
    tt_id = add_ticket.json()["id"]

    # "attendee list" equivalent coverage through ticket metadata embedded in event detail.
    detail_after = client.get(f"/events/{event_id}")
    assert detail_after.status_code == 200
    assert any(tt["id"] == tt_id for tt in detail_after.json()["ticket_types"])

    del_ticket = client.delete(f"/events/ticket-types/{tt_id}", headers=test_provider["headers"])
    assert del_ticket.status_code == 200
    assert del_ticket.json()["ok"] is True

    deleted = client.delete(f"/events/{event_id}", headers=test_provider["headers"])
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True
