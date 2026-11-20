import logging
from typing import Any, Dict, List, Optional
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are StudyBot, an empathetic, encouraging, and highly disciplined AI study coach for StudyPod AI.
Your goal is to help peer study pods stay focused, accountable, motivated, and collaborative.
Always keep answers concise, action-oriented, supportive, and grounded in effective learning techniques (e.g., active recall, spaced repetition, Pomodoro method, Feynman technique).
"""


def _get_client() -> Optional[OpenAI]:
    """Return an OpenAI client instance if a valid API key is configured."""
    key = settings.OPENAI_API_KEY
    if key and key.strip() and not key.startswith("your-openai"):
        try:
            return OpenAI(api_key=key.strip())
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}")
    return None


def get_ai_response(pod_context: Dict[str, Any], user_message: str) -> str:
    """Generate an AI coach response based on current pod context and user query."""
    client = _get_client()
    pod_name = pod_context.get("name", "StudyPod")
    exam = pod_context.get("exam_category", "exam preparation")
    members = pod_context.get("members", [])
    members_str = ", ".join(members) if isinstance(members, list) else str(members)

    context_prompt = (
        f"{SYSTEM_PROMPT}\n"
        f"Context:\n"
        f"- Pod Name: {pod_name}\n"
        f"- Target Exam: {exam}\n"
        f"- Members: {members_str}\n"
        f"Respond to the following message from a pod member with practical advice or encouragement."
    )

    if client:
        try:
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": context_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=350,
                temperature=0.7,
            )
            content = completion.choices[0].message.content
            if content:
                return content.strip()
        except Exception as exc:
            logger.error(f"OpenAI error in get_ai_response: {exc}")

    # Fallback response
    return (
        f"🤖 [StudyBot]: Keep up the great work in {pod_name}! "
        f"Remember that consistent, focused 25-minute sprints with spaced recall "
        f"will help you conquer {exam}. Break your current milestone into mini-tasks "
        f"and let's get after it together!"
    )


def generate_welcome_message(pod: Any) -> str:
    """Generate a warm, motivating welcome message and icebreaker for a newly matched pod."""
    pod_name = getattr(pod, "name", None) or (pod.get("name") if isinstance(pod, dict) else "StudyPod")
    exam = getattr(pod, "exam_category", None) or (pod.get("exam_category") if isinstance(pod, dict) else "your exam")

    client = _get_client()
    if client:
        try:
            prompt = (
                f"{SYSTEM_PROMPT}\n"
                f"A new study pod called '{pod_name}' targeting '{exam}' has just formed.\n"
                f"Write a brief (under 80 words) energizing welcome message and include ONE quick fun icebreaker question for the members."
            )
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": prompt}],
                max_tokens=150,
                temperature=0.8,
            )
            content = completion.choices[0].message.content
            if content:
                return content.strip()
        except Exception as exc:
            logger.error(f"OpenAI error in generate_welcome_message: {exc}")

    return (
        f"🎉 Welcome to **{pod_name}**! You're now a 4-person accountability crew preparing for **{exam}**.\n\n"
        f"💡 **Icebreaker**: What is one topic in {exam} you feel most confident in, and one you want to master this month? "
        f"Drop your answers below to kick things off!"
    )


def generate_daily_checkin(pod: Any) -> str:
    """Generate a daily check-in message encouraging the pod to review goals and start a session."""
    pod_name = getattr(pod, "name", None) or (pod.get("name") if isinstance(pod, dict) else "StudyPod")
    exam = getattr(pod, "exam_category", None) or (pod.get("exam_category") if isinstance(pod, dict) else "your exam")

    client = _get_client()
    if client:
        try:
            prompt = (
                f"{SYSTEM_PROMPT}\n"
                f"Pod: '{pod_name}' ({exam}). Generate a concise daily morning check-in (under 50 words) "
                f"reminding them to log their study hours and set today's milestone."
            )
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": prompt}],
                max_tokens=100,
                temperature=0.7,
            )
            content = completion.choices[0].message.content
            if content:
                return content.strip()
        except Exception as exc:
            logger.error(f"OpenAI error in generate_daily_checkin: {exc}")

    return (
        f"☀️ Good morning, **{pod_name}**! Today is another chance to build your streak for **{exam}**. "
        f"What is your #1 priority milestone today? Jump into a synced Pomodoro session when you're ready to focus!"
    )


def generate_weekly_summary(pod: Any, stats: Dict[str, Any]) -> str:
    """Generate a weekly summary celebrating pod achievements and highlighting areas for focus."""
    pod_name = getattr(pod, "name", None) or (pod.get("name") if isinstance(pod, dict) else "StudyPod")
    total_minutes = stats.get("total_minutes", 0)
    completed_milestones = stats.get("completed_milestones", 0)

    client = _get_client()
    if client:
        try:
            prompt = (
                f"{SYSTEM_PROMPT}\n"
                f"Weekly recap for '{pod_name}'. Stats: {total_minutes} total study minutes, "
                f"{completed_milestones} milestones completed. Write a 3-sentence celebratory and forward-looking summary."
            )
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": prompt}],
                max_tokens=150,
                temperature=0.7,
            )
            content = completion.choices[0].message.content
            if content:
                return content.strip()
        except Exception as exc:
            logger.error(f"OpenAI error in generate_weekly_summary: {exc}")

    hours = round(total_minutes / 60, 1)
    return (
        f"📊 **Weekly Debrief for {pod_name}**:\n"
        f"Together you logged **{hours} hours** ({total_minutes} mins) and knocked out **{completed_milestones} milestones**! "
        f"Tremendous effort this week. Let's reset goals and carry this momentum into next week! 🚀"
    )


def generate_nudge(user: Any, days_inactive: int) -> str:
    """Generate a friendly accountability nudge for a user falling behind."""
    username = getattr(user, "username", None) or (user.get("username") if isinstance(user, dict) else str(user))

    client = _get_client()
    if client:
        try:
            prompt = (
                f"{SYSTEM_PROMPT}\n"
                f"Pod member '{username}' hasn't checked in for {days_inactive} days. "
                f"Write a warm, non-judgmental, motivating nudge (under 40 words) encouraging them to restart with just 15 minutes today."
            )
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": prompt}],
                max_tokens=80,
                temperature=0.7,
            )
            content = completion.choices[0].message.content
            if content:
                return content.strip()
        except Exception as exc:
            logger.error(f"OpenAI error in generate_nudge: {exc}")

    return (
        f"Hey @{username}! We missed you over the past {days_inactive} days! "
        f"Don't worry about lost time—even a 15-minute quick sprint today keeps your study habit alive. "
        f"Your pod has your back! 💪"
    )
