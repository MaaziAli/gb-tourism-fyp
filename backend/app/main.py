"""
GB Tourism - FastAPI Backend Application
"""

from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine

# ── Model imports ──
from app.models import user as _user_model  # noqa
from app.models import listing as _listing_model  # noqa
from app.models import booking as _booking_model  # noqa
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
from app.models import ticket_booking as _tb_model  # noqa
from app.models import wishlist as _w_model  # noqa
from app.models import availability as _av_model  # noqa
from app.models import coupon as _coupon_model  # noqa
from app.models import loyalty as _loyalty_model  # noqa
from app.models import refund as _refund_model  # noqa
from app.models import listing_addon as _addon_model  # noqa

try:
    from app.models import message as _msg  # noqa
except Exception as e:
    print(f"Warning: message model: {e}")

try:
    from app.models import recently_viewed as _rv  # noqa
except Exception as e:
    print(f"Warning: recently_viewed model: {e}")

# ── Router imports ──
from app.routers import admin
from app.routers import addons
from app.routers import auth
from app.routers import availability
from app.routers import bookings
from app.routers import coupons
from app.routers import dining
from app.routers import events
from app.routers import group_bookings
from app.routers import hotels
from app.routers import listing_images
from app.routers import listings
from app.routers import loyalty
from app.routers import notifications
from app.routers import payments
from app.routers import xpay_payments
from app.routers import mock_payment
from app.routers import recommendations
from app.routers import reviews
from app.routers import room_types
from app.routers import rooms
from app.routers import stripe_payments
from app.routers import ticket_bookings
from app.routers import trip_planner
from app.routers import users
from app.routers import wishlist

messages_router = None
recently_viewed_router = None

try:
    from app.routers import messages as msg_mod

    messages_router = msg_mod.router
except Exception as e:
    print(f"Warning: messages router: {e}")

try:
    from app.routers import recently_viewed as rv_mod

    recently_viewed_router = rv_mod.router
except Exception as e:
    print(f"Warning: recently_viewed router: {e}")

# Save and serve uploads from backend/uploads/
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def create_app() -> FastAPI:
    """Application factory for FastAPI."""
    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
    )
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

    Base.metadata.create_all(bind=engine)

    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(listings.router)
    app.include_router(addons.router)
    app.include_router(hotels.router)      # dedicated hotel endpoints
    app.include_router(rooms.router)       # dedicated room endpoints
    app.include_router(bookings.router)
    app.include_router(recommendations.router)
    app.include_router(admin.router)
    app.include_router(reviews.router)
    app.include_router(listing_images.router)
    app.include_router(room_types.router)
    app.include_router(notifications.router)
    app.include_router(payments.router)
    app.include_router(stripe_payments.router)  # Stripe checkout flow
    app.include_router(xpay_payments.router)    # XPay Global checkout flow
    app.include_router(mock_payment.router)     # Mock payment (prototype)
    app.include_router(trip_planner.router)
    app.include_router(dining.router)
    app.include_router(events.router)
    app.include_router(ticket_bookings.router)
    app.include_router(wishlist.router)
    app.include_router(availability.router)
    app.include_router(group_bookings.router)
    app.include_router(coupons.router)
    app.include_router(loyalty.router)

    if messages_router:
        app.include_router(messages_router)
        print("[OK] Messages router loaded")
    else:
        print("[WARN] Messages router NOT loaded")

    if recently_viewed_router:
        app.include_router(recently_viewed_router)
        print("[OK] Recently viewed router loaded")
    else:
        print("[WARN] Recently viewed router NOT loaded")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    # ── APScheduler: release expired booking holds ────────────────────────
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.database import SessionLocal
        from app.models.booking import Booking as _Booking

        def _release_expired_holds():
            db = SessionLocal()
            try:
                expired = (
                    db.query(_Booking)
                    .filter(
                        _Booking.status == "pending_payment",
                        _Booking.hold_expires_at < datetime.utcnow(),
                    )
                    .all()
                )
                for b in expired:
                    b.status = "cancelled"
                    b.hold_expires_at = None
                if expired:
                    db.commit()
                    print(f"[APScheduler] Released {len(expired)} expired booking hold(s)")
            except Exception as exc:
                print(f"[APScheduler] Error releasing holds: {exc}")
            finally:
                db.close()

        _scheduler = BackgroundScheduler()
        _scheduler.add_job(_release_expired_holds, "interval", minutes=1, id="release_holds")

        @app.on_event("startup")
        def start_scheduler():
            _scheduler.start()
            print("[APScheduler] Hold-release scheduler started")

        @app.on_event("shutdown")
        def stop_scheduler():
            _scheduler.shutdown(wait=False)
            print("[APScheduler] Scheduler stopped")

    except ImportError:
        print("[WARN] apscheduler not installed — expired hold cleanup disabled")

    @app.get("/")
    def root():
        return {"message": "GB Tourism Backend is running"}

    return app


app = create_app()
