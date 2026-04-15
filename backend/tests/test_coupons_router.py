from __future__ import annotations

from datetime import date, timedelta


def _create_coupon(client, headers, **overrides):
    payload = {
        "code": "SAVE20",
        "title": "Save 20",
        "discount_type": "percentage",
        "discount_value": 20,
        "min_booking_amount": 0,
        "max_uses": 10,
        "max_uses_per_user": 2,
        "valid_from": date.today().isoformat(),
        "valid_until": (date.today() + timedelta(days=30)).isoformat(),
        "is_public": True,
    }
    payload.update(overrides)
    return client.post("/coupons/", headers=headers, json=payload)


def test_coupon_create_validate_public_and_admin_listing(client, test_provider, test_admin, test_user):
    created = _create_coupon(client, test_provider["headers"])
    assert created.status_code == 200, created.text
    code = created.json()["code"]

    validate = client.post(
        "/coupons/validate",
        headers=test_user["headers"],
        json={
            "code": code,
            "booking_amount": 5000,
        },
    )
    assert validate.status_code == 200
    assert validate.json()["valid"] is True
    assert validate.json()["discount_amount"] == 1000

    public = client.get("/coupons/public")
    assert public.status_code == 200
    assert any(c["code"] == code for c in public.json())

    admin_all = client.get("/coupons/admin/all", headers=test_admin["headers"])
    assert admin_all.status_code == 200
    assert any(c["code"] == code for c in admin_all.json())


def test_coupon_update_and_delete(client, test_provider):
    created = _create_coupon(client, test_provider["headers"], code="EDITME")
    assert created.status_code == 200
    cid = created.json()["id"]

    updated = client.put(
        f"/coupons/{cid}",
        headers=test_provider["headers"],
        json={"title": "Edited Title", "max_uses": 99},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Edited Title"
    assert updated.json()["max_uses"] == 99

    deleted = client.delete(f"/coupons/{cid}", headers=test_provider["headers"])
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True

    validate_deleted = client.post(
        "/coupons/validate",
        headers=test_provider["headers"],
        json={"code": "EDITME", "booking_amount": 1000},
    )
    assert validate_deleted.status_code == 404


def test_coupon_invalid_discount_validation(client, test_provider):
    bad = _create_coupon(
        client,
        test_provider["headers"],
        code="BADPERCENT",
        discount_type="percentage",
        discount_value=101,
    )
    assert bad.status_code == 400

    bad_type = _create_coupon(
        client,
        test_provider["headers"],
        code="BADTYPE",
        discount_type="weird",
    )
    assert bad_type.status_code == 400
