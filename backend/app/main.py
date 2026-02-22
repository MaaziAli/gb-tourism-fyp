"""
GB Tourism - FastAPI Backend Application
"""
from fastapi import FastAPI

from app.config import settings
from app.database import Base, engine
from app.routers import auth, bookings, listings


def create_app() -> FastAPI:
    """Application factory for FastAPI."""
    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
    )

    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Include routers
    app.include_router(auth.router)
    app.include_router(bookings.router)
    app.include_router(listings.router)

    @app.get("/")
    def root():
        return {"message": "GB Tourism Backend is running"}

    return app


app = create_app()
