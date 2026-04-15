from __future__ import annotations

from app.models.notification import Notification


def test_notifications_mark_read_clear_all_and_stats(client, db_session, test_user):
    db_session.add_all(
        [
            Notification(
                user_id=test_user["user"]["id"],
                title="Booking",
                message="Booking confirmed",
                type="booking",
                is_read=False,
            ),
            Notification(
                user_id=test_user["user"]["id"],
                title="Payment",
                message="Payment done",
                type="payment",
                is_read=False,
            ),
        ]
    )
    db_session.commit()

    listing = client.get("/notifications/", headers=test_user["headers"])
    assert listing.status_code == 200
    data = listing.json()
    assert len(data) >= 2
    notif_id = data[0]["id"]

    mark = client.patch(f"/notifications/{notif_id}/read", headers=test_user["headers"])
    assert mark.status_code == 200
    assert mark.json()["ok"] is True

    stats = client.get("/notifications/stats", headers=test_user["headers"])
    assert stats.status_code == 200
    assert stats.json()["total"] >= 2
    assert "by_type" in stats.json()

    unread_count = client.get("/notifications/unread-count", headers=test_user["headers"])
    assert unread_count.status_code == 200
    assert "count" in unread_count.json()

    clear = client.delete("/notifications/clear-all", headers=test_user["headers"])
    assert clear.status_code == 200
    assert clear.json()["ok"] is True

    post_clear = client.get("/notifications/", headers=test_user["headers"])
    assert post_clear.status_code == 200
    assert post_clear.json() == []
