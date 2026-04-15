from __future__ import annotations

from tests.conftest import create_listing


def test_wishlist_add_remove_and_ids(client, test_user, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Wish Listing",
        location="Naltar",
        price_per_night=7000,
        service_type="hotel",
        rooms_available=2,
    )

    add = client.post(f"/wishlist/{listing['id']}", headers=test_user["headers"])
    assert add.status_code == 200
    assert add.json()["saved"] is True

    ids = client.get("/wishlist/ids", headers=test_user["headers"])
    assert ids.status_code == 200
    assert listing["id"] in ids.json()

    full = client.get("/wishlist/", headers=test_user["headers"])
    assert full.status_code == 200
    assert any(item["id"] == listing["id"] for item in full.json())

    remove = client.delete(f"/wishlist/{listing['id']}", headers=test_user["headers"])
    assert remove.status_code == 200
    assert remove.json()["saved"] is False
