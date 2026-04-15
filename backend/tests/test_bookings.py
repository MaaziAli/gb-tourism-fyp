from __future__ import annotations

from datetime import date, timedelta

from app.models.booking import Booking
from app.models.coupon import Coupon
from app.models.listing import Listing
from app.models.loyalty import LoyaltyAccount
from app.models.loyalty import LoyaltyTransaction
from app.models.payment import Payment
from app.models.seasonal_price import SeasonalPrice
from tests.conftest import _login, _register, create_listing


def _booking_payload(listing_id: int, check_in: date, check_out: date, **extra):
    payload = {
        "listing_id": listing_id,
        "check_in": check_in.isoformat(),
        "check_out": check_out.isoformat(),
        "guests": 1,
    }
    payload.update(extra)
    return payload


def test_create_booking(client, test_user, test_listing):
    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=2)
    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["listing_id"] == test_listing["id"]
    assert data["status"] == "active"
    assert data["total_price"] == 20000


def test_create_booking_own_listing(client, test_provider, test_listing):
    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=1)
    res = client.post(
        "/bookings/",
        headers=test_provider["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    assert res.status_code == 400
    assert "own listings" in res.json()["detail"].lower()


def test_create_booking_past_dates(client, test_user, test_listing):
    check_in = date.today() - timedelta(days=1)
    check_out = date.today() + timedelta(days=1)
    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    assert res.status_code == 400
    assert "past" in res.json()["detail"].lower()


def test_create_booking_overlap(client, test_user, test_listing):
    _register(
        client,
        full_name="Other User",
        email="other_user@example.com",
        password="password123",
        role="user",
    )
    other_login = _login(client, email="other_user@example.com", password="password123")
    other_headers = {"Authorization": f"Bearer {other_login['access_token']}"}

    check_in = date.today() + timedelta(days=10)
    check_out = check_in + timedelta(days=2)

    first = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    second = client.post(
        "/bookings/",
        headers=other_headers,
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )

    assert first.status_code == 200
    assert second.status_code == 400
    assert "overlap" in second.json()["detail"].lower()


def test_cancel_booking(client, test_user, test_listing):
    check_in = date.today() + timedelta(days=8)
    check_out = check_in + timedelta(days=1)
    create = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    booking_id = create.json()["id"]
    cancel = client.patch(f"/bookings/{booking_id}/cancel", headers=test_user["headers"])
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"


def test_cancel_booking_already_cancelled(client, test_user, test_listing):
    check_in = date.today() + timedelta(days=8)
    check_out = check_in + timedelta(days=1)
    create = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    booking_id = create.json()["id"]
    first_cancel = client.patch(f"/bookings/{booking_id}/cancel", headers=test_user["headers"])
    second_cancel = client.patch(f"/bookings/{booking_id}/cancel", headers=test_user["headers"])
    assert first_cancel.status_code == 200
    assert second_cancel.status_code == 400


def test_cancellation_policy_refund(client, db_session, test_user, test_listing):
    check_in = date.today() + timedelta(days=14)
    check_out = check_in + timedelta(days=2)

    create = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    booking_id = create.json()["id"]

    listing = db_session.query(Listing).filter(Listing.id == test_listing["id"]).first()
    listing.cancellation_policy = "moderate"
    booking = db_session.query(Booking).filter(Booking.id == booking_id).first()
    booking.payment_status = "paid"
    db_session.add(
        Payment(
            booking_id=booking_id,
            user_id=test_user["user"]["id"],
            amount=booking.total_price,
            platform_commission=0,
            provider_amount=booking.total_price,
            status="completed",
            payment_method="mock",
            transaction_id="refund-test",
        )
    )
    db_session.commit()

    cancel = client.patch(f"/bookings/{booking_id}/cancel", headers=test_user["headers"])
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"
    assert cancel.json()["payment_status"] in {"refunded", "partially_refunded", "paid"}


def test_booking_with_coupon(client, db_session, test_user, test_listing):
    coupon = Coupon(
        created_by=test_user["user"]["id"],
        code="SAVE10",
        title="Save 10%",
        discount_type="percentage",
        discount_value=10,
        min_booking_amount=0,
        max_uses=100,
        max_uses_per_user=5,
        valid_from=date.today().isoformat(),
        valid_until=(date.today() + timedelta(days=30)).isoformat(),
        is_active=True,
        scope="all",
    )
    db_session.add(coupon)
    db_session.commit()

    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=2)
    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out, coupon_code="SAVE10"),
    )
    assert res.status_code == 200, res.text
    assert res.json()["total_price"] == 18000

    invalid = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in + timedelta(days=4), check_out + timedelta(days=4), coupon_code="BADCODE"),
    )
    assert invalid.status_code == 400


def test_booking_with_loyalty_points(client, db_session, test_user, test_listing):
    db_session.add(
        LoyaltyAccount(
            user_id=test_user["user"]["id"],
            total_points=100000,
            lifetime_points=100000,
            tier="silver",
        )
    )
    db_session.commit()

    check_in = date.today() + timedelta(days=9)
    check_out = check_in + timedelta(days=2)
    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(
            test_listing["id"],
            check_in,
            check_out,
            loyalty_points_used=50000,
        ),
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["loyalty_points_used"] > 0
    assert data["loyalty_discount_applied"] > 0

    redeem_txn = (
        db_session.query(LoyaltyTransaction)
        .filter(
            LoyaltyTransaction.user_id == test_user["user"]["id"],
            LoyaltyTransaction.reference_id == data["id"],
            LoyaltyTransaction.transaction_type == "redeem",
        )
        .first()
    )
    assert redeem_txn is not None
    assert redeem_txn.points < 0


def test_booking_with_seasonal_pricing(client, db_session, test_user, test_listing):
    check_in = date.today() + timedelta(days=11)
    check_out = check_in + timedelta(days=2)
    db_session.add(
        SeasonalPrice(
            listing_id=test_listing["id"],
            name="High season",
            start_date=check_in,
            end_date=check_out,
            price_multiplier=1.5,
            fixed_surcharge=500,
            is_active=True,
        )
    )
    db_session.commit()

    res = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(test_listing["id"], check_in, check_out),
    )
    assert res.status_code == 200
    assert res.json()["total_price"] > 20000


def test_booking_car_rental_with_insurance(client, test_user, test_provider):
    listing = create_listing(
        client,
        token=test_provider["token"],
        title="Rental Car",
        location="Gilgit",
        price_per_night=4000,
        service_type="car_rental",
        rooms_available=1,
    )
    # set insurance options via listing update endpoint
    update = client.put(
        f"/listings/{listing['id']}",
        headers=test_provider["headers"],
        data={
            "title": "Rental Car",
            "location": "Gilgit",
            "price_per_night": "4000",
            "service_type": "car_rental",
            "description": "Updated",
            "amenities": "[]",
            "cancellation_policy": "moderate",
            "cancellation_hours_free": "48",
            "rooms_available": "1",
            "insurance_options": '[{"name":"basic","price_per_day":500}]',
            "pickup_location": "Airport",
            "dropoff_location": "City Center",
            "pickup_time": "09:00",
            "dropoff_time": "18:00",
            "fuel_policy": "full_to_full",
            "mileage_limit": "200",
        },
    )
    assert update.status_code == 200, update.text

    check_in = date.today() + timedelta(days=12)
    check_out = check_in + timedelta(days=2)
    booking = client.post(
        "/bookings/",
        headers=test_user["headers"],
        json=_booking_payload(
            listing["id"],
            check_in,
            check_out,
            rental_details={"selected_insurance": ["basic"]},
        ),
    )
    assert booking.status_code == 200, booking.text
    data = booking.json()
    # 4000*2 + insurance(500*2) = 9000
    assert data["total_price"] == 9000
