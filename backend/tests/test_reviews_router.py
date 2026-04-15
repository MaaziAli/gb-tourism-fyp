from __future__ import annotations

from datetime import date, timedelta


def test_review_creation_provider_reply_and_delete(client, db_session, test_user, test_provider, test_listing):
    # Create a historical booking so review is allowed.
    check_in = date.today() - timedelta(days=5)
    check_out = date.today() - timedelta(days=2)
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
    # Past check-in is blocked by create booking endpoint, so insert booking directly.
    if booking.status_code != 200:
        from app.models.booking import Booking

        db_session.add(
            Booking(
                listing_id=test_listing["id"],
                user_id=test_user["user"]["id"],
                check_in=check_in,
                check_out=check_out,
                total_price=10000,
                status="active",
                payment_status="unpaid",
            )
        )
        db_session.commit()

    create_review = client.post(
        f"/reviews/listing/{test_listing['id']}",
        headers=test_user["headers"],
        json={"rating": 5, "comment": "Amazing stay"},
    )
    assert create_review.status_code == 200, create_review.text
    rid = create_review.json()["id"]

    fetched = client.get(f"/reviews/listing/{test_listing['id']}")
    assert fetched.status_code == 200
    assert any(r["id"] == rid for r in fetched.json())

    reply = client.post(
        f"/reviews/{rid}/reply",
        headers=test_provider["headers"],
        json={"reply": "Thank you!"},
    )
    assert reply.status_code == 200
    assert reply.json()["ok"] is True

    summary = client.get(f"/reviews/listing/{test_listing['id']}/summary")
    assert summary.status_code == 200
    assert summary.json()["total_reviews"] >= 1

    deleted = client.delete(f"/reviews/{rid}", headers=test_user["headers"])
    assert deleted.status_code == 204
