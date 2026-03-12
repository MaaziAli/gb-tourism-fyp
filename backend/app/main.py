"""
GB Tourism - FastAPI Backend Application
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, bookings, listings


UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


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

    # Static files for uploaded images
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    @app.get("/")
    def root():
        return {"message": "GB Tourism Backend is running"}

    return app


app = create_app()