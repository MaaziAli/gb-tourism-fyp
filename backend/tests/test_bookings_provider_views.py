from __future__ import annotations

from datetime import date, timedelta

from app.models.review import Review


def test_bookings_provider_views_and_voucher(client, db_session, test_user, test_provider, test_admin, test_listing):
    check_in = date.today() + timedelta(days=9)
    check_out = check_in + timedelta(days=3)
    create = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": test_listing["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 2,
        },
    )
    assert create.status_code == 200, create.text
    booking_id = create.json()["id"]

    # Add review so provider analytics paths execute richer logic.
    db_session.add(
        Review(
            listing_id=test_listing["id"],
            user_id=test_user["user"]["id"],
            rating=4,
            comment="Good",
        )
    )
    db_session.commit()

    provider_dashboard = client.get("/bookings/provider/dashboard", headers=test_provider["headers"])
    assert provider_dashboard.status_code == 200
    assert "summary" in provider_dashboard.json()

    provider_earnings = client.get("/bookings/provider/earnings-breakdown", headers=test_provider["headers"])
    assert provider_earnings.status_code == 200
    assert "totals" in provider_earnings.json()

    provider_analytics = client.get("/bookings/provider/analytics", headers=test_provider["headers"])
    assert provider_analytics.status_code == 200
    assert "total_listings" in provider_analytics.json()

    provider_revenue = client.get("/bookings/provider/revenue", headers=test_provider["headers"])
    assert provider_revenue.status_code == 200
    assert "total_bookings" in provider_revenue.json()

    listing_bookings = client.get(
        f"/bookings/listing/{test_listing['id']}/bookings",
        headers=test_provider["headers"],
    )
    assert listing_bookings.status_code == 200
    assert len(listing_bookings.json()) >= 1

    voucher_as_user = client.get(f"/bookings/{booking_id}/voucher", headers=test_user["headers"])
    assert voucher_as_user.status_code == 200
    assert voucher_as_user.json()["booking_id"] == booking_id

    voucher_as_admin = client.get(f"/bookings/{booking_id}/voucher", headers=test_admin["headers"])
    assert voucher_as_admin.status_code == 200
