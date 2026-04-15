from __future__ import annotations

from datetime import date, timedelta


def test_availability_block_unblock_and_range(client, test_provider, test_listing):
    d1 = (date.today() + timedelta(days=10)).isoformat()
    d2 = (date.today() + timedelta(days=11)).isoformat()

    block = client.post(
        f"/availability/{test_listing['id']}/block",
        headers=test_provider["headers"],
        json={"dates": [d1, d2], "reason": "maintenance"},
    )
    assert block.status_code == 200
    assert block.json()["added"] >= 2

    month_data = client.get(
        f"/availability/{test_listing['id']}",
        params={"year": date.today().year, "month": date.today().month},
    )
    assert month_data.status_code == 200
    blocked_dates = [item["date"] for item in month_data.json()["blocked_dates"]]
    assert d1 in blocked_dates

    ranged = client.get(f"/availability/{test_listing['id']}/range", params={"months_ahead": 2})
    assert ranged.status_code == 200
    assert d1 in ranged.json()

    unblock = client.post(
        f"/availability/{test_listing['id']}/unblock",
        headers=test_provider["headers"],
        json={"dates": [d1]},
    )
    assert unblock.status_code == 200
    assert unblock.json()["ok"] is True
