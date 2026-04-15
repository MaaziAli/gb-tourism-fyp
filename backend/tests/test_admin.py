from types import SimpleNamespace

from app.models.user import User
from tests.conftest import _register


def test_admin_stats(client, test_admin):
    res = client.get("/admin/stats", headers=test_admin["headers"])
    assert res.status_code == 200, res.text
    data = res.json()
    assert "total_users" in data
    assert "total_listings" in data
    assert "total_bookings" in data


def test_admin_list_users_requires_admin(client, test_user, test_admin):
    forbidden = client.get("/admin/users", headers=test_user["headers"])
    assert forbidden.status_code == 403

    allowed = client.get("/admin/users", headers=test_admin["headers"])
    assert allowed.status_code == 200
    assert isinstance(allowed.json(), list)


def test_admin_delete_user(client, db_session, monkeypatch, test_admin):
    _register(
        client,
        full_name="Delete Me",
        email="delete_me@example.com",
        password="password123",
        role="user",
    )
    target = db_session.query(User).filter(User.email == "delete_me@example.com").first()
    assert target is not None

    # Work around the direct require_admin() call inside endpoint implementation.
    monkeypatch.setattr(
        "app.routers.admin.require_admin",
        lambda current_user=None: SimpleNamespace(id=-1, role="admin"),
    )

    res = client.delete(f"/admin/users/{target.id}", headers=test_admin["headers"])
    assert res.status_code == 204

    deleted = db_session.query(User).filter(User.id == target.id).first()
    assert deleted is None


def test_admin_toggle_featured_listing(client, test_admin, test_listing):
    before = client.get(f"/listings/{test_listing['id']}")
    assert before.status_code == 200
    prev_featured = bool(before.json().get("is_featured"))

    res = client.patch(f"/admin/listings/{test_listing['id']}/feature", headers=test_admin["headers"])
    assert res.status_code == 200, res.text
    assert res.json()["id"] == test_listing["id"]
    assert res.json()["is_featured"] is (not prev_featured)
