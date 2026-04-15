from __future__ import annotations

from tests.test_events_router import _create_event


def test_ticket_booking_flow_and_attendees(client, test_provider, test_user):
    event = _create_event(client, test_provider["headers"], title="Ticket Event")
    event_id = event["id"]
    ticket_type_id = event["ticket_types"][0]["id"]

    book = client.post(
        "/ticket-bookings/book",
        headers=test_user["headers"],
        json={
            "event_id": event_id,
            "ticket_type_id": ticket_type_id,
            "quantity": 2,
            "payment_method": "card",
            "card_number": "4242424242424242",
        },
    )
    assert book.status_code == 200, book.text
    booking_id = book.json()["id"]
    assert book.json()["status"] == "confirmed"

    mine = client.get("/ticket-bookings/my-tickets", headers=test_user["headers"])
    assert mine.status_code == 200
    assert any(t["id"] == booking_id for t in mine.json())

    attendees = client.get(f"/ticket-bookings/event/{event_id}/attendees", headers=test_provider["headers"])
    assert attendees.status_code == 200
    assert attendees.json()["total_bookings"] >= 1
    assert len(attendees.json()["attendees"]) >= 1

    analytics = client.get("/ticket-bookings/provider-analytics", headers=test_provider["headers"])
    assert analytics.status_code == 200
    assert "summary" in analytics.json()

    cancel = client.patch(f"/ticket-bookings/{booking_id}/cancel", headers=test_user["headers"])
    assert cancel.status_code == 200
    assert cancel.json()["ok"] is True
