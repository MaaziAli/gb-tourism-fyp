from tests.conftest import _login


def test_register_success(client):
    res = client.post(
        "/auth/register",
        json={
            "full_name": "Auth User",
            "email": "auth_user@example.com",
            "password": "password123",
            "role": "user",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "auth_user@example.com"
    assert data["role"] == "user"
    assert "id" in data


def test_register_duplicate_email(client):
    payload = {
        "full_name": "Dup User",
        "email": "dup@example.com",
        "password": "password123",
        "role": "user",
    }
    first = client.post("/auth/register", json=payload)
    second = client.post("/auth/register", json=payload)
    assert first.status_code == 200
    assert second.status_code == 400
    assert "already registered" in second.json()["detail"].lower()


def test_login_success(client, test_user):
    res = client.post(
        "/auth/login",
        json={"email": test_user["user"]["email"], "password": "password123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["user"]["email"] == test_user["user"]["email"]


def test_login_invalid_credentials(client, test_user):
    res = client.post(
        "/auth/login",
        json={"email": test_user["user"]["email"], "password": "wrong-password"},
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()


def test_protected_route_no_token(client):
    res = client.get("/users/me")
    # HTTPBearer typically returns 403 for missing header.
    assert res.status_code in {401, 403}


def test_token_validation(client, test_user):
    res = client.get("/users/me", headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == test_user["user"]["email"]


def test_role_based_access(client, test_provider):
    provider_admin_access = client.get("/admin/stats", headers=test_provider["headers"])
    assert provider_admin_access.status_code == 403

    # sanity check: provider token is otherwise valid
    provider_me = client.get("/users/me", headers=test_provider["headers"])
    assert provider_me.status_code == 200

    # and login still works with same creds
    relogin = _login(client, email=test_provider["user"]["email"], password="password123")
    assert "access_token" in relogin
