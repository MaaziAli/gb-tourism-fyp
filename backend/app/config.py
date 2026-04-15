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

    # XPay Global
    XPAY_API_KEY: str = "sk_sandbox_your_xpay_api_key_here"
    XPAY_COMMUNITY_ID: str = "your_community_id_here"
    XPAY_ENVIRONMENT: str = "sandbox"
    XPAY_WEBHOOK_SECRET: str = "whsec_your_xpay_webhook_secret"

    # Frontend URL for redirects
    FRONTEND_URL: str = "http://localhost:5173"

    # Webhook log verbosity: "debug" | "info" | "warning" | "error"
    WEBHOOK_LOG_LEVEL: str = "info"

    # ── Email ──────────────────────────────────────────────────────────────
    # Set EMAIL_ENABLED=false to silence all outbound email (useful in dev).
    EMAIL_ENABLED: bool = True
    # "resend" uses the Resend API (pip install resend).
    # "smtp"   uses STARTTLS SMTP (e.g. Gmail app password).
    EMAIL_PROVIDER: str = "resend"
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@gbtourism.com"

    # Admin email – receives new-listing notifications
    ADMIN_EMAIL: str = "admin@gbtourism.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
