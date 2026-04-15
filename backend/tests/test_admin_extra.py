from __future__ import annotations

from app.models.review import Review


def test_admin_listings_reviews_and_analytics(client, db_session, test_admin, test_user, test_listing):
    listings = client.get("/admin/listings", headers=test_admin["headers"])
    assert listings.status_code == 200
    assert any(l["id"] == test_listing["id"] for l in listings.json())

    db_session.add(
        Review(
            listing_id=test_listing["id"],
            user_id=test_user["user"]["id"],
            rating=5,
            comment="Excellent",
        )
    )
    db_session.commit()

    reviews = client.get("/admin/reviews", headers=test_admin["headers"])
    assert reviews.status_code == 200
    assert len(reviews.json()) >= 1
    review_id = reviews.json()[0]["id"]

    analytics = client.get("/admin/analytics/overview", headers=test_admin["headers"])
    assert analytics.status_code == 200
    assert "totals" in analytics.json()

    role_update = client.patch(
        f"/admin/users/{test_user['user']['id']}/role",
        headers=test_admin["headers"],
        json={"role": "provider"},
    )
    assert role_update.status_code == 200
    assert role_update.json()["role"] == "provider"

    delete_review = client.delete(f"/admin/reviews/{review_id}", headers=test_admin["headers"])
    assert delete_review.status_code == 204
