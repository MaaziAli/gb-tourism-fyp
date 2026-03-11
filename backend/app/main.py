"""
GB Tourism - FastAPI Backend Application
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.engine.url import make_url

from app.config import settings
from app.database import Base, engine
from app.routers import auth, bookings, listings


UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def _reset_sqlite_db_if_needed() -> None:
  """Delete existing SQLite DB file in development to sync schema."""
  url = settings.DATABASE_URL
  # Only apply to SQLite URLs
  if not url.startswith("sqlite"):
      return
  try:
      db_url = make_url(url)
      if not db_url.database:
          return
      db_path = Path(db_url.database)
      if db_path.is_file():
          db_path.unlink()
  except Exception:
      # Fail silently; better to run with old DB than crash on startup
      return


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

    # Reset SQLite DB in development and create database tables
    _reset_sqlite_db_if_needed()
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