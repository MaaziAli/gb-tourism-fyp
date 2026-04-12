"""
Application configuration settings.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "sqlite:///./db.sqlite3"

    # App
    APP_TITLE: str = "GB Tourism Backend"
    APP_VERSION: str = "0.1.0"

    # Stripe (test mode keys)
    STRIPE_SECRET_KEY: str = "sk_test_your_stripe_secret_key_here"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_your_stripe_publishable_key_here"
    STRIPE_WEBHOOK_SECRET: str = "whsec_your_webhook_secret_here"

    # Frontend URL for Stripe redirects
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
