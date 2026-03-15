"""
GB Tourism - FastAPI Backend Application
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.models import review as _review_model  # noqa
from app.models import listing_image as _li_model  # noqa
from app.models import room_type as _rt_model  # noqa
from app.models import notification as _notif_model  # noqa
from app.models import payment as _pay_model  # noqa
from app.models import trip_plan as _tp_model  # noqa
from app.models import dining_package as _dp_model  # noqa
from app.models import table_reservation as _tr_model  # noqa
from app.models import event as _event_model  # noqa
from app.models import ticket_type as _tt_event_model  # noqa
from app.routers import (
    auth,
    bookings,
    listings,
    users,
    recommendations,
    admin,
    reviews as reviews_router,
    listing_images as li_router,
    room_types as rt_router,
    notifications as notif_router,
    payments as pay_router,
    trip_planner as tp_router,
    dining as dining_router,
    events as events_router,
)


# Save and serve uploads from backend/uploads/
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def create_app() -> FastAPI:
    """Application factory for FastAPI."""
    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
    )
    # Enable CORS for React frontend
    origins = [
        "http://localhost:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create database tables (no destructive reset; tables created if missing)
    Base.metadata.create_all(bind=engine)

    # Include routers
    app.include_router(auth.router)
    app.include_router(bookings.router)
    app.include_router(listings.router)
    app.include_router(users.router)
    app.include_router(recommendations.router)
    app.include_router(admin.router)
    app.include_router(reviews_router.router)
    app.include_router(li_router.router)
    app.include_router(rt_router.router)
    app.include_router(notif_router.router)
    app.include_router(pay_router.router)
    app.include_router(tp_router.router)
    app.include_router(dining_router.router)
    app.include_router(events_router.router)

    # Static files for uploaded images
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    @app.get("/")
    def root():
        return {"message": "GB Tourism Backend is running"}

    return app


app = create_app()