from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.main import create_app


def _register(client: TestClient, *, full_name: str, email: str, password: str, role: str) -> dict:
    res = client.post(
        "/auth/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": password,
            "role": role,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


def _login(client: TestClient, *, email: str, password: str) -> dict:
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def create_listing(
    client: TestClient,
    *,
    token: str,
    title: str = "Test Hotel",
    location: str = "Hunza",
    price_per_night: float = 10000,
    service_type: str = "hotel",
    rooms_available: int = 10,
) -> dict:
    res = client.post(
        "/listings/",
        headers=_auth_headers(token),
        data={
            "title": title,
            "location": location,
            "price_per_night": str(price_per_night),
            "service_type": service_type,
            "description": "Test listing",
            "amenities": "[]",
            "cancellation_policy": "moderate",
            "cancellation_hours_free": "48",
            "rooms_available": str(rooms_available),
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    Base.metadata.drop_all(bind=db_engine)
    Base.metadata.create_all(bind=db_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=db_engine)


@pytest.fixture()
def app(db_engine, monkeypatch):
    # Keep tests self-contained and deterministic.
    settings.DATABASE_URL = "sqlite:///:memory:"
    settings.EMAIL_ENABLED = False
    settings.STRIPE_SECRET_KEY = "sk_test_fake"
    settings.STRIPE_PUBLISHABLE_KEY = "pk_test_fake"
    settings.STRIPE_WEBHOOK_SECRET = "whsec_test_fake"
    settings.XPAY_API_KEY = "xpay_test_key"
    settings.XPAY_COMMUNITY_ID = "xpay_test_community"
    settings.XPAY_WEBHOOK_SECRET = "xpay_test_secret"

    # Explicitly mock resend sender path.
    monkeypatch.setattr("app.utils.email._send_via_resend", lambda *args, **kwargs: None, raising=False)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    Base.metadata.create_all(bind=db_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    application = create_app()
    application.dependency_overrides[get_db] = override_get_db
    yield application
    application.dependency_overrides.clear()
    Base.metadata.drop_all(bind=db_engine)


@pytest.fixture()
def client(app):
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def test_user(client: TestClient):
    user = _register(
        client,
        full_name="Test User",
        email="user@example.com",
        password="password123",
        role="user",
    )
    login = _login(client, email="user@example.com", password="password123")
    return {
        "user": user,
        "token": login["access_token"],
        "headers": _auth_headers(login["access_token"]),
    }


@pytest.fixture()
def test_provider(client: TestClient):
    user = _register(
        client,
        full_name="Test Provider",
        email="provider@example.com",
        password="password123",
        role="provider",
    )
    login = _login(client, email="provider@example.com", password="password123")
    return {
        "user": user,
        "token": login["access_token"],
        "headers": _auth_headers(login["access_token"]),
    }


@pytest.fixture()
def test_admin(client: TestClient):
    user = _register(
        client,
        full_name="Test Admin",
        email="admin@example.com",
        password="password123",
        role="admin",
    )
    login = _login(client, email="admin@example.com", password="password123")
    return {
        "user": user,
        "token": login["access_token"],
        "headers": _auth_headers(login["access_token"]),
    }


@pytest.fixture()
def test_listing(client: TestClient, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Fixture Hotel",
        location="Skardu",
        price_per_night=10000,
        service_type="hotel",
        rooms_available=5,
    )
    return listing


@pytest.fixture()
def future_dates():
    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=2)
    return {"check_in": check_in.isoformat(), "check_out": check_out.isoformat()}
