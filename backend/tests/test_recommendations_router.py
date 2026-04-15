from __future__ import annotations

from datetime import date, timedelta

from app.core.jwt import create_access_token
from tests.conftest import create_listing


def test_recommendations_guest_and_similar(client, test_provider, test_user):
    base = create_listing(
        client,
        token=test_provider["token"],
        title="Reco Base",
        location="Gilgit",
        price_per_night=7000,
        service_type="hotel",
        rooms_available=2,
    )
    other = create_listing(
        client,
        token=test_provider["token"],
        title="Reco Other",
        location="Gilgit",
        price_per_night=7500,
        service_type="hotel",
        rooms_available=2,
    )

    # Create one active booking to make listing "popular" for guest recommendations.
    check_in = date.today() + timedelta(days=9)
    check_out = check_in + timedelta(days=2)
    booking = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": base["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
        },
    )
    assert booking.status_code == 200, booking.text

    guest = client.get("/recommendations/")
    assert guest.status_code == 200
    assert len(guest.json()) >= 1

    similar = client.get(f"/recommendations/similar/{base['id']}")
    assert similar.status_code == 200
    assert any(item["id"] == other["id"] for item in similar.json())


def test_recommendations_authenticated_profile_path(client, test_provider, test_user):
    first = create_listing(
        client,
        token=test_provider["token"],
        title="Auth Reco 1",
        location="Hunza",
        price_per_night=8000,
        service_type="tour",
        rooms_available=2,
    )
    second = create_listing(
        client,
        token=test_provider["token"],
        title="Auth Reco 2",
        location="Hunza Valley",
        price_per_night=8200,
        service_type="tour",
        rooms_available=2,
    )

    # Build booking history.
    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)
    seed = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json={
            "listing_id": first["id"],
            "check_in": check_in.isoformat(),
            "check_out": check_out.isoformat(),
            "guests": 1,
        },
    )
    assert seed.status_code == 200, seed.text

    # recommendations router expects JWT sub=email
    email_token = create_access_token({"sub": test_user["user"]["email"]})
    auth_headers = {"Authorization": f"Bearer {email_token}"}
    res = client.get("/recommendations/", headers=auth_headers)
    assert res.status_code == 200
    assert any(item["id"] == second["id"] for item in res.json())
