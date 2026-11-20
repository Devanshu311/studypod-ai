from datetime import date, datetime, timedelta
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.study_log import StudyLog
from app.models.milestone import Milestone
from app.models.chat import ChatMessage
from app.services.ai_coach import generate_nudge


def check_daily_progress(db: Session) -> List[Dict[str, Any]]:
    """
    Compare each user's study_hours_goal (minutes) against today's StudyLog minutes_studied.
    Returns summary report of daily goal achievements.
    """
    today = date.today()
    users = db.query(User).all()
    results = []

    for user in users:
        log = db.query(StudyLog).filter(
            StudyLog.user_id == user.id,
            StudyLog.date == today
        ).first()

        studied = log.minutes_studied if log else 0
        goal = user.study_hours_goal or 120
        achieved = studied >= goal

        results.append({
            "user_id": user.id,
            "username": user.username,
            "goal_minutes": goal,
            "minutes_studied": studied,
            "achieved": achieved,
            "percentage": min(100.0, round((studied / goal) * 100, 1)) if goal > 0 else 100.0
        })

    return results


def update_streaks(db: Session) -> None:
    """
    Update streak_count based on consecutive active study days for all users.
    """
    today = date.today()
    yesterday = today - timedelta(days=1)
    users = db.query(User).all()

    for user in users:
        today_log = db.query(StudyLog).filter(
            StudyLog.user_id == user.id,
            StudyLog.date == today
        ).first()

        if not today_log:
            today_log = StudyLog(
                user_id=user.id,
                date=today,
                minutes_studied=0,
                milestones_completed=0,
                streak_count=0
            )
            db.add(today_log)
            db.flush()

        if today_log.minutes_studied > 0:
            yesterday_log = db.query(StudyLog).filter(
                StudyLog.user_id == user.id,
                StudyLog.date == yesterday
            ).first()

            if yesterday_log and yesterday_log.minutes_studied > 0:
                today_log.streak_count = yesterday_log.streak_count + 1
            else:
                today_log.streak_count = 1

    db.commit()


def check_overdue_milestones(db: Session) -> List[Milestone]:
    """
    Find milestones past their due_date that are still pending or in_progress,
    update their status to 'overdue', and notify their pods.
    """
    now = datetime.utcnow()
    overdue_milestones = db.query(Milestone).filter(
        Milestone.due_date < now,
        Milestone.status.in_(["pending", "in_progress"])
    ).all()

    for m in overdue_milestones:
        m.status = "overdue"
        # Post system message to the pod
        system_alert = ChatMessage(
            pod_id=m.pod_id,
            user_id=None,
            content=f"⚠️ Milestone Overdue: '{m.title}' was due on {m.due_date.strftime('%b %d, %Y')}.",
            message_type="milestone_update",
            created_at=datetime.utcnow()
        )
        db.add(system_alert)

    db.commit()
    return overdue_milestones


def generate_falling_behind_alerts(db: Session) -> List[Dict[str, Any]]:
    """
    Detect users with 2 or more consecutive inactive days and generate nudges.
    """
    today = date.today()
    cutoff_2_days = today - timedelta(days=2)
    users = db.query(User).all()
    alerts = []

    for user in users:
        recent_logs = db.query(StudyLog).filter(
            StudyLog.user_id == user.id,
            StudyLog.date >= cutoff_2_days,
            StudyLog.minutes_studied > 0
        ).count()

        if recent_logs == 0:
            days_inactive = 2
            # Check 3 days just in case
            cutoff_3_days = today - timedelta(days=3)
            three_day_count = db.query(StudyLog).filter(
                StudyLog.user_id == user.id,
                StudyLog.date >= cutoff_3_days,
                StudyLog.minutes_studied > 0
            ).count()
            if three_day_count == 0:
                days_inactive = 3

            nudge_message = generate_nudge(user, days_inactive)

            # Post nudge to each active pod the user is in
            for membership in user.memberships:
                if membership.pod and membership.pod.is_active:
                    nudge_chat = ChatMessage(
                        pod_id=membership.pod.id,
                        user_id=None,
                        content=nudge_message,
                        message_type="ai_coach",
                        created_at=datetime.utcnow()
                    )
                    db.add(nudge_chat)

            alerts.append({
                "user_id": user.id,
                "username": user.username,
                "days_inactive": days_inactive,
                "nudge": nudge_message
            })

    db.commit()
    return alerts
