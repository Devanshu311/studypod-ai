import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers import auth, milestones, pods, pomodoro
from app.services.accountability import (
    check_daily_progress,
    check_overdue_milestones,
    generate_falling_behind_alerts,
    update_streaks,
)
from app.websocket.handlers import socketio_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studypod-ai")

# Initialize FastAPI application
app = FastAPI(
    title="StudyPod AI",
    description="Collaborative AI-powered peer study pods platform with real-time sync, accountability, and AI coaching.",
    version="1.0.0"
)

# CORS middleware configuration supporting Netlify domains and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(pods.router, prefix="/api/pods")
app.include_router(milestones.router, prefix="/api/milestones")
app.include_router(pomodoro.router, prefix="/api/pomodoro")

# Mount Socket.IO ASGI app
app.mount("/socket.io", socketio_app)

# APScheduler instance for background maintenance
scheduler = BackgroundScheduler()


def run_daily_check():
    """Scheduled task: check daily study goal progress, streaks, and falling behind alerts."""
    logger.info("Executing scheduled daily accountability check...")
    db = SessionLocal()
    try:
        check_daily_progress(db)
        update_streaks(db)
        generate_falling_behind_alerts(db)
        logger.info("Daily accountability check completed successfully.")
    except Exception as exc:
        logger.error(f"Error during daily check: {exc}")
    finally:
        db.close()


def run_overdue_check():
    """Scheduled task: check and flag overdue milestones."""
    logger.info("Executing scheduled overdue milestone check...")
    db = SessionLocal()
    try:
        overdue = check_overdue_milestones(db)
        logger.info(f"Overdue milestone check completed. Flagged {len(overdue)} milestones.")
    except Exception as exc:
        logger.error(f"Error during overdue milestone check: {exc}")
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    """Initialize database tables and start background task scheduler."""
    logger.info("Starting StudyPod AI backend...")
    # Create all tables if not existing
    Base.metadata.create_all(bind=engine)

    # Schedule daily check at 9 PM (21:00)
    scheduler.add_job(
        run_daily_check,
        CronTrigger(hour=21, minute=0),
        id="daily_check",
        replace_existing=True
    )

    # Schedule overdue milestone check every 6 hours
    scheduler.add_job(
        run_overdue_check,
        IntervalTrigger(hours=6),
        id="overdue_check",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started with daily and overdue milestone jobs.")


@app.on_event("shutdown")
def shutdown_event():
    """Shutdown background task scheduler."""
    logger.info("Shutting down StudyPod AI backend...")
    if scheduler.running:
        scheduler.shutdown()


@app.get("/")
def root():
    """Root endpoint returning API service status and version."""
    return {"message": "StudyPod AI API", "version": "1.0.0"}
