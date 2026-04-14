from __future__ import annotations

from datetime import date

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.listing_addon import ListingAddon

PRICE_TYPES = {"per_night", "per_person", "per_booking"}


def calculate_nights(check_in: date | None, check_out: date | None) -> int:
    if not check_in or not check_out:
        return 1
    return max(1, (check_out - check_in).days)


def _price_multiplier(price_type: str, nights: int, guests: int) -> int:
    if price_type == "per_night":
        return max(1, nights)
    if price_type == "per_person":
        return max(1, guests)
    return 1


def _to_int(value, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _serialize_addon_for_booking(
    addon: ListingAddon,
    quantity: int,
    nights: int,
    guests: int,
) -> dict:
    multiplier = _price_multiplier(addon.price_type, nights, guests)
    line_total = round(float(addon.price) * quantity * multiplier, 2)
    return {
        # Keep legacy structure compatible: `price` is per-line total.
        "id": addon.id,
        "name": addon.name,
        "price": line_total,
        "quantity": quantity,
        "total": line_total,
        "unit_price": float(addon.price),
        "price_type": addon.price_type,
        "description": addon.description,
        "is_optional": bool(addon.is_optional),
        "max_quantity": addon.max_quantity,
        "calc_multiplier": multiplier,
    }


def validate_and_normalize_addons(
    db: Session,
    *,
    listing_id: int,
    room_type_id: int | None,
    selected_addons: list[dict] | None,
    nights: int,
    guests: int,
) -> tuple[list[dict], float]:
    """
    Validate selected add-ons against ListingAddon records and return:
      1) normalized add-ons list for Booking.addons JSON
      2) total add-ons amount
    """
    selected_addons = selected_addons or []
    nights = max(1, _to_int(nights, 1))
    guests = max(1, _to_int(guests, 1))

    available = (
        db.query(ListingAddon)
        .filter(
            ListingAddon.listing_id == listing_id,
            ListingAddon.is_active.is_(True),
            or_(
                ListingAddon.room_type_id.is_(None),
                ListingAddon.room_type_id == room_type_id,
            ),
        )
        .order_by(ListingAddon.sort_order.asc(), ListingAddon.id.asc())
        .all()
    )
    available_by_id = {a.id: a for a in available}

    if not available and selected_addons:
        raise HTTPException(
            status_code=400,
            detail="Selected add-ons are not available for this listing",
        )

    normalized: list[dict] = []
    selected_ids: set[int] = set()

    for item in selected_addons:
        addon_id = _to_int(
            item.get("id") or item.get("addon_id") or item.get("listing_addon_id"),
            0,
        )
        addon = available_by_id.get(addon_id)
        if addon is None:
            # Backward compatible fallback by exact name.
            item_name = str(item.get("name") or "").strip().lower()
            matches = [a for a in available if a.name.strip().lower() == item_name]
            if len(matches) != 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid add-on selection: {item.get('name') or addon_id}",
                )
            addon = matches[0]

        quantity = max(1, _to_int(item.get("quantity"), 1))
        max_qty = max(1, addon.max_quantity or 1)
        if quantity > max_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Quantity for '{addon.name}' cannot exceed {max_qty}",
            )

        normalized.append(
            _serialize_addon_for_booking(addon, quantity, nights, guests)
        )
        selected_ids.add(addon.id)

    required_addons = [a for a in available if not a.is_optional]
    for addon in required_addons:
        if addon.id in selected_ids:
            continue
        normalized.append(
            _serialize_addon_for_booking(addon, quantity=1, nights=nights, guests=guests)
        )

    addons_total = round(sum(float(a.get("total", 0) or 0) for a in normalized), 2)
    return normalized, addons_total
