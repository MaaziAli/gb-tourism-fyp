from __future__ import annotations

from datetime import date, timedelta

from app.models.listing import Listing
from app.models.review import Review
from tests.conftest import create_listing


def test_featured_and_smart_search_filters(client, db_session, test_provider, test_user):
    hotel = create_listing(
        client,
        token=test_provider["token"],
        title="Featured Hotel",
        location="Hunza",
        price_per_night=9000,
        service_type="hotel",
        rooms_available=4,
    )
    tour = create_listing(
        client,
        token=test_provider["token"],
        title="River Tour",
        location="Skardu",
        price_per_night=6000,
        service_type="tour",
        rooms_available=2,
    )

    # Make one listing featured and searchable by amenities/rating.
    hotel_row = db_session.query(Listing).filter(Listing.id == hotel["id"]).first()
    hotel_row.is_featured = True
    hotel_row.amenities = '["wifi","breakfast"]'
    db_session.add(
        Review(
            listing_id=hotel["id"],
            user_id=test_user["user"]["id"],
            rating=5,
            comment="Great stay",
        )
    )
    db_session.commit()

    featured = client.get("/listings/featured")
    assert featured.status_code == 200
    ids = [item["id"] for item in featured.json()]
    assert hotel["id"] in ids

    check_in = date.today() + timedelta(days=6)
    check_out = check_in + timedelta(days=2)
    search = client.get(
        "/listings/search",
        params={
            "q": "Featured",
            "service_type": "hotel,tour",
            "location": "Hunza",
            "min_price": 5000,
            "max_price": 12000,
            "min_rating": 4,
            "amenities": "wifi",
            "sort_by": "rating",
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
        },
    )
    assert search.status_code == 200, search.text
    data = search.json()
    assert data["total"] >= 1
    first = data["results"][0]
    assert first["id"] == hotel["id"]
    assert first["available_rooms"] is not None
    assert data["filters_applied"]["location"] == "Hunza"

    # Ensure the non-matching listing is filtered out.
    assert all(item["id"] != tour["id"] for item in data["results"])


def test_compare_endpoint_validation_and_payload(client, db_session, test_provider, test_user):
    first = create_listing(
        client,
        token=test_provider["token"],
        title="Compare A",
        location="Gilgit",
        price_per_night=7000,
        service_type="hotel",
        rooms_available=2,
    )
    second = create_listing(
        client,
        token=test_provider["token"],
        title="Compare B",
        location="Nagar",
        price_per_night=8000,
        service_type="tour",
        rooms_available=2,
    )
    third = create_listing(
        client,
        token=test_provider["token"],
        title="Compare C",
        location="Astore",
        price_per_night=6500,
        service_type="hotel",
        rooms_available=2,
    )

    # Attach reviews so distribution/highlights paths execute.
    db_session.add_all(
        [
            Review(listing_id=first["id"], user_id=test_user["user"]["id"], rating=5, comment="a"),
            Review(listing_id=second["id"], user_id=test_user["user"]["id"], rating=4, comment="b"),
            Review(listing_id=third["id"], user_id=test_user["user"]["id"], rating=3, comment="c"),
        ]
    )
    db_session.commit()

    invalid = client.get("/listings/compare", params={"ids": "bad-id"})
    assert invalid.status_code == 400

    too_many = client.get(
        "/listings/compare",
        params={"ids": f"{first['id']},{second['id']},{third['id']},999"},
    )
    assert too_many.status_code == 400

    ok = client.get("/listings/compare", params={"ids": f"{second['id']},{first['id']}"})
    assert ok.status_code == 200, ok.text
    payload = ok.json()
    assert payload["count"] == 2
    assert payload["listings"][0]["id"] == second["id"]
    assert "rating_distribution" in payload["listings"][0]
    assert "highlights" in payload["listings"][0]
