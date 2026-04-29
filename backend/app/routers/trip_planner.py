from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json
import uuid
import httpx
import asyncio
from urllib.parse import quote
from bs4 import BeautifulSoup

from app.database import get_db
from app.models.trip_plan import TripPlan
from app.models.listing import Listing
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/trip-planner", tags=["Trip Planner"]
)

BUDGET_TIERS = {
    "budget": {"hotel_max": 3000, "transport_max": 1500,
               "activity_max": 1000},
    "standard": {"hotel_max": 8000, "transport_max": 4000,
                 "activity_max": 3000},
    "luxury": {"hotel_max": 999999,
               "transport_max": 999999,
               "activity_max": 999999},
}


class PlanRequest(BaseModel):
    destination: str
    duration_days: int
    budget_tier: str
    total_budget: float
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class SavePlanRequest(BaseModel):
    title: str
    destination: str
    duration_days: int
    budget_tier: str
    total_budget: float
    estimated_cost: float
    hotel_id: Optional[int] = None
    transport_id: Optional[int] = None
    activity_ids: Optional[List[int]] = []
    notes: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_public: bool = False


def get_listing_dict(listing, duration=1):
    if not listing:
        return None
    price = getattr(listing, "price_per_night", None) or getattr(listing, "price", None) or 0
    return {
        "id": listing.id,
        "title": listing.title,
        "location": listing.location,
        "price_per_night": price,
        "total_price": price * duration,
        "service_type": listing.service_type,
        "image_url": listing.image_url,
        "description": getattr(listing, "description", None),
    }


# AI Web Agent Fallback — searches web when local DB results are sparse
async def search_web_for_destination(destination: str, service_type: str) -> list[dict]:
    try:
        query = f"{destination} Pakistan {service_type} booking price PKR"
        encoded_query = quote(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                url, headers=headers, follow_redirects=True
            )

        soup = BeautifulSoup(response.text, "html.parser")
        results = []

        result_divs = soup.find_all("div", class_="result", limit=5)
        for div in result_divs:
            title_el = div.find(class_="result__title")
            snippet_el = div.find(class_="result__snippet")
            url_el = div.find(class_="result__url")

            name = title_el.get_text(strip=True) if title_el else ""
            description = snippet_el.get_text(strip=True) if snippet_el else ""
            link = url_el.get_text(strip=True) if url_el else ""

            if name:
                if link and not link.startswith("http"):
                    link = "https://" + link
                results.append({
                    "name": name,
                    "description": description,
                    "url": link,
                    "source": "web",
                    "service_type": service_type,
                    "location": destination,
                })

        return results
    except Exception:
        return []


@router.post("/suggest")
async def suggest_trip(
    body: PlanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    dest_lower = body.destination.lower()
    tier = BUDGET_TIERS.get(
        body.budget_tier, BUDGET_TIERS["standard"]
    )

    daily_budget = body.total_budget / body.duration_days
    hotel_budget_per_night = daily_budget * 0.5
    transport_budget = body.total_budget * 0.2
    activity_budget = body.total_budget * 0.3

    hotel_budget_per_night = min(
        hotel_budget_per_night, tier["hotel_max"]
    )

    hotels = db.query(Listing).filter(
        Listing.service_type == "hotel"
    ).all()
    matched_hotels = [
        h for h in hotels
        if dest_lower in (h.location or "").lower()
        or (h.location or "").lower() in dest_lower
        or any(
            word in (h.location or "").lower()
            for word in dest_lower.split()
            if len(word) > 3
        )
    ]
    _has_dest_hotels = len(matched_hotels) > 0

    affordable_hotels = [
        h for h in matched_hotels
        if (h.price_per_night or 0) <= hotel_budget_per_night
    ]
    if not affordable_hotels:
        affordable_hotels = sorted(
            matched_hotels,
            key=lambda h: h.price_per_night or 0
        )

    suggested_hotel = (
        max(affordable_hotels,
            key=lambda h: h.price_per_night or 0)
        if affordable_hotels else None
    )

    transports = db.query(Listing).filter(
        Listing.service_type.in_([
            "transport", "car_rental",
            "bike_rental", "jeep_safari",
        ])
    ).all()
    matched_transport = [
        t for t in transports
        if dest_lower in (t.location or "").lower()
        or (t.location or "").lower() in dest_lower
        or any(
            word in (t.location or "").lower()
            for word in dest_lower.split()
            if len(word) > 3
        )
    ]
    affordable_transport = [
        t for t in matched_transport
        if (t.price_per_night or 0) <= transport_budget
    ]
    if not affordable_transport:
        affordable_transport = sorted(
            matched_transport,
            key=lambda t: t.price_per_night or 0
        )

    suggested_transport = (
        affordable_transport[0]
        if affordable_transport else None
    )

    activities_all = db.query(Listing).filter(
        Listing.service_type.in_([
            "tour", "activity", "horse_riding",
            "guide", "boat_trip", "camping",
        ])
    ).all()
    matched_activities = [
        a for a in activities_all
        if dest_lower in (a.location or "").lower()
        or (a.location or "").lower() in dest_lower
        or any(
            word in (a.location or "").lower()
            for word in dest_lower.split()
            if len(word) > 3
        )
    ]
    affordable_activities = [
        a for a in matched_activities
        if (a.price_per_night or 0) <= activity_budget / 2
    ]
    suggested_activities = affordable_activities[:3]

    hotel_cost = (
        (suggested_hotel.price_per_night or 0)
        * body.duration_days
        if suggested_hotel else 0
    )
    transport_cost = (
        suggested_transport.price_per_night
        if suggested_transport else 0
    )
    activity_cost = sum(
        a.price_per_night or 0
        for a in suggested_activities
    )
    estimated_cost = (
        hotel_cost + transport_cost + activity_cost
    )

    alt_hotels = [
        h for h in matched_hotels
        if h.id != (
            suggested_hotel.id
            if suggested_hotel else None
        )
    ][:4]

    alt_transports = [
        t for t in matched_transport
        if t.id != (
            suggested_transport.id
            if suggested_transport else None
        )
    ][:3]

    alt_activities = [
        a for a in matched_activities
        if a.id not in [
            x.id for x in suggested_activities
        ]
    ][:4]

    # AI Web Agent Fallback — searches web when local DB results are sparse
    web_hotels = []
    web_transports = []
    web_activities = []

    if len(matched_hotels) < 2:
        web_hotels = await search_web_for_destination(
            body.destination, "hotel"
        )

    if len(matched_transport) < 1:
        web_transports = await search_web_for_destination(
            body.destination, "jeep rental transport"
        )

    if len(suggested_activities) < 2:
        web_activities = await search_web_for_destination(
            body.destination, "tour activity trekking"
        )

    return {
        "destination": body.destination,
        "duration_days": body.duration_days,
        "budget_tier": body.budget_tier,
        "total_budget": body.total_budget,
        "estimated_cost": estimated_cost,
        "budget_remaining": (
            body.total_budget - estimated_cost
        ),
        "db_results_found": _has_dest_hotels,
        "hotel": get_listing_dict(
            suggested_hotel, body.duration_days
        ),
        "transport": get_listing_dict(
            suggested_transport, 1
        ),
        "activities": [
            get_listing_dict(a, 1)
            for a in suggested_activities
        ],
        "alternatives": {
            "hotels": [
                get_listing_dict(h, body.duration_days)
                for h in alt_hotels
            ],
            "transports": [
                get_listing_dict(t, 1)
                for t in alt_transports
            ],
            "activities": [
                get_listing_dict(a, 1)
                for a in alt_activities
            ],
        },
        "breakdown": {
            "hotel": hotel_cost,
            "transport": transport_cost,
            "activities": activity_cost,
        },
        "external_suggestions": {
            "hotels": web_hotels,
            "transports": web_transports,
            "activities": web_activities,
            "note": "These results are from the web and cannot be booked through GB Tourism yet. They are shown to help you plan your trip."
        }
    }


@router.post("/save")
def save_trip_plan(
    body: SavePlanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    share_code = str(uuid.uuid4())[:8].upper() \
        if body.is_public else None

    plan = TripPlan(
        user_id=current_user.id,
        title=body.title,
        destination=body.destination,
        start_date=body.start_date,
        end_date=body.end_date,
        duration_days=body.duration_days,
        budget_tier=body.budget_tier,
        total_budget=body.total_budget,
        estimated_cost=body.estimated_cost,
        hotel_id=body.hotel_id,
        transport_id=body.transport_id,
        activities=json.dumps(
            body.activity_ids or []
        ),
        notes=body.notes,
        is_public=body.is_public,
        share_code=share_code
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {
        "id": plan.id,
        "share_code": plan.share_code,
        "message": "Trip plan saved!"
    }


@router.get("/my-plans")
def get_my_plans(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    plans = db.query(TripPlan).filter(
        TripPlan.user_id == current_user.id
    ).order_by(TripPlan.created_at.desc()).all()

    result = []
    for p in plans:
        hotel = db.query(Listing).filter(
            Listing.id == p.hotel_id
        ).first() if p.hotel_id else None

        result.append({
            "id": p.id,
            "title": p.title,
            "destination": p.destination,
            "duration_days": p.duration_days,
            "budget_tier": p.budget_tier,
            "total_budget": p.total_budget,
            "estimated_cost": p.estimated_cost,
            "start_date": p.start_date,
            "end_date": p.end_date,
            "hotel_title": hotel.title
            if hotel else None,
            "hotel_image": hotel.image_url
            if hotel else None,
            "is_public": p.is_public,
            "share_code": p.share_code,
            "created_at": p.created_at.isoformat()
            if p.created_at else None
        })
    return result


@router.get("/share/{share_code}")
def get_shared_plan(
    share_code: str,
    db: Session = Depends(get_db)
):
    plan = db.query(TripPlan).filter(
        TripPlan.share_code == share_code,
        TripPlan.is_public == True
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    hotel = db.query(Listing).filter(
        Listing.id == plan.hotel_id
    ).first() if plan.hotel_id else None

    transport = db.query(Listing).filter(
        Listing.id == plan.transport_id
    ).first() if plan.transport_id else None

    activity_ids = json.loads(plan.activities or "[]")
    activities = db.query(Listing).filter(
        Listing.id.in_(activity_ids)
    ).all() if activity_ids else []

    return {
        "title": plan.title,
        "destination": plan.destination,
        "duration_days": plan.duration_days,
        "budget_tier": plan.budget_tier,
        "total_budget": plan.total_budget,
        "estimated_cost": plan.estimated_cost,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "hotel": {
            "title": hotel.title,
            "location": hotel.location,
            "price_per_night": hotel.price_per_night,
            "image_url": hotel.image_url
        } if hotel else None,
        "transport": {
            "title": transport.title,
            "location": transport.location,
            "price_per_night": transport.price_per_night
        } if transport else None,
        "activities": [
            {
                "title": a.title,
                "location": a.location,
                "price_per_night": a.price_per_night,
                "service_type": a.service_type
            }
            for a in activities
        ]
    }


@router.delete("/my-plans/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    plan = db.query(TripPlan).filter(
        TripPlan.id == plan_id,
        TripPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"ok": True}
