import logging
from datetime import datetime
from typing import Any, Dict, Optional
from urllib.parse import parse_qs
import jwt
import socketio

from app.config import settings
from app.database import SessionLocal
from app.models.chat import ChatMessage
from app.models.pod import PodMembership, StudyPod
from app.models.pomodoro import PomodoroParticipant, PomodoroSession
from app.models.user import User
from app.services.ai_coach import get_ai_response

logger = logging.getLogger(__name__)

# Initialize Socket.IO AsyncServer
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False
)
socketio_app = socketio.ASGIApp(sio, socketio_path="")


@sio.event
async def connect(sid: str, environ: Dict[str, Any], auth: Optional[Dict[str, Any]] = None):
    """Authenticate incoming connection via JWT token from query string or auth payload."""
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    if not token and "QUERY_STRING" in environ:
        query_params = parse_qs(environ.get("QUERY_STRING", ""))
        if "token" in query_params and query_params["token"]:
            token = query_params["token"][0]

    if not token:
        logger.warning(f"Connection rejected for {sid}: missing token")
        return False

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return False

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            username = user.username
        finally:
            db.close()

        await sio.save_session(sid, {"user_id": user_id, "username": username})
        logger.info(f"User {username} ({user_id}) connected with sid {sid}")
        return True
    except Exception as exc:
        logger.warning(f"Auth error for sid {sid}: {exc}")
        return False


@sio.event
async def disconnect(sid: str):
    """Clean up on client disconnect."""
    session = await sio.get_session(sid)
    if session:
        logger.info(f"User {session.get('username')} disconnected (sid: {sid})")


@sio.event
async def join_pod(sid: str, data: Dict[str, Any]):
    """Join a Socket.IO room for a study pod."""
    pod_id = data.get("pod_id")
    if not pod_id:
        return {"error": "Missing pod_id"}

    room = f"pod_{pod_id}"
    await sio.enter_room(sid, room)
    session = await sio.get_session(sid)
    username = session.get("username", "A user") if session else "A user"

    await sio.emit(
        "user_joined_pod",
        {"user_id": session.get("user_id") if session else None, "username": username, "pod_id": pod_id},
        room=room,
        skip_sid=sid
    )
    return {"status": "joined", "room": room}


@sio.event
async def leave_pod(sid: str, data: Dict[str, Any]):
    """Leave the Socket.IO room for a study pod."""
    pod_id = data.get("pod_id")
    if not pod_id:
        return {"error": "Missing pod_id"}

    room = f"pod_{pod_id}"
    await sio.leave_room(sid, room)
    session = await sio.get_session(sid)
    username = session.get("username", "A user") if session else "A user"

    await sio.emit(
        "user_left_pod",
        {"user_id": session.get("user_id") if session else None, "username": username, "pod_id": pod_id},
        room=room
    )
    return {"status": "left", "room": room}


@sio.event
async def send_message(sid: str, data: Dict[str, Any]):
    """Save a chat message to DB, broadcast to pod room, and trigger AI response if @studybot mentioned."""
    pod_id = data.get("pod_id")
    content = data.get("content", "").strip()

    if not pod_id or not content:
        return {"error": "pod_id and content are required"}

    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else None
    username = session.get("username", "Member") if session else "Member"

    db = SessionLocal()
    try:
        # Save user message
        chat_msg = ChatMessage(
            pod_id=pod_id,
            user_id=user_id,
            content=content,
            message_type="text",
            created_at=datetime.utcnow()
        )
        db.add(chat_msg)
        db.commit()
        db.refresh(chat_msg)

        msg_payload = {
            "id": chat_msg.id,
            "pod_id": chat_msg.pod_id,
            "user_id": chat_msg.user_id,
            "username": username,
            "content": chat_msg.content,
            "message_type": chat_msg.message_type,
            "created_at": chat_msg.created_at.isoformat()
        }

        # Broadcast user message
        room = f"pod_{pod_id}"
        await sio.emit("new_message", msg_payload, room=room)

        # Check if @studybot is mentioned
        if "@studybot" in content.lower():
            pod = db.query(StudyPod).filter(StudyPod.id == pod_id).first()
            members = [m.user.username for m in pod.members if m.user] if pod else []
            pod_context = {
                "name": pod.name if pod else "StudyPod",
                "exam_category": pod.exam_category if pod else "General",
                "members": members
            }

            # Generate AI coach response
            ai_reply = get_ai_response(pod_context, content)

            ai_msg = ChatMessage(
                pod_id=pod_id,
                user_id=None,
                content=ai_reply,
                message_type="ai_coach",
                created_at=datetime.utcnow()
            )
            db.add(ai_msg)
            db.commit()
            db.refresh(ai_msg)

            ai_payload = {
                "id": ai_msg.id,
                "pod_id": ai_msg.pod_id,
                "user_id": None,
                "username": "StudyBot",
                "content": ai_msg.content,
                "message_type": ai_msg.message_type,
                "created_at": ai_msg.created_at.isoformat()
            }
            await sio.emit("new_message", ai_payload, room=room)

        return {"status": "sent", "message_id": chat_msg.id}
    finally:
        db.close()


@sio.event
async def start_pomodoro(sid: str, data: Dict[str, Any]):
    """Create a Pomodoro session and notify the pod."""
    pod_id = data.get("pod_id")
    duration = int(data.get("duration_minutes", 25))
    break_mins = int(data.get("break_minutes", 5))

    if not pod_id:
        return {"error": "Missing pod_id"}

    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else None
    username = session.get("username", "A pod member") if session else "A pod member"

    db = SessionLocal()
    try:
        # Complete previous active sessions in pod
        active_sessions = db.query(PomodoroSession).filter(
            PomodoroSession.pod_id == pod_id,
            PomodoroSession.status == "active"
        ).all()
        for s in active_sessions:
            s.status = "completed"

        pomo = PomodoroSession(
            pod_id=pod_id,
            initiated_by=user_id,
            started_at=datetime.utcnow(),
            duration_minutes=duration,
            break_minutes=break_mins,
            status="active"
        )
        db.add(pomo)
        db.flush()

        participant = PomodoroParticipant(
            session_id=pomo.id,
            user_id=user_id,
            joined_at=datetime.utcnow(),
            completed=False,
            focus_score=100.0
        )
        db.add(participant)

        # Chat announcement
        invite_chat = ChatMessage(
            pod_id=pod_id,
            user_id=user_id,
            content=f"⏱️ @{username} started a {duration}-minute Pomodoro session!",
            message_type="pomodoro_invite",
            created_at=datetime.utcnow()
        )
        db.add(invite_chat)
        db.commit()

        room = f"pod_{pod_id}"
        event_payload = {
            "session_id": pomo.id,
            "pod_id": pod_id,
            "initiated_by": user_id,
            "duration_minutes": duration,
            "break_minutes": break_mins,
            "started_at": pomo.started_at.isoformat(),
            "participants": [{"user_id": user_id, "username": username}]
        }
        await sio.emit("pomodoro_started", event_payload, room=room)
        return {"status": "started", "session": event_payload}
    finally:
        db.close()


@sio.event
async def join_pomodoro(sid: str, data: Dict[str, Any]):
    """Join an active Pomodoro session and notify pod members."""
    session_id = data.get("session_id")
    pod_id = data.get("pod_id")

    if not session_id or not pod_id:
        return {"error": "session_id and pod_id are required"}

    session = await sio.get_session(sid)
    user_id = session.get("user_id") if session else None
    username = session.get("username", "A pod member") if session else "A pod member"

    db = SessionLocal()
    try:
        pomo = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
        if not pomo or pomo.status != "active":
            return {"error": "Pomodoro session is not active"}

        existing = db.query(PomodoroParticipant).filter(
            PomodoroParticipant.session_id == session_id,
            PomodoroParticipant.user_id == user_id
        ).first()

        if not existing:
            participant = PomodoroParticipant(
                session_id=session_id,
                user_id=user_id,
                joined_at=datetime.utcnow(),
                completed=False,
                focus_score=100.0
            )
            db.add(participant)
            db.commit()

        room = f"pod_{pod_id}"
        await sio.emit(
            "pomodoro_participant_joined",
            {"session_id": session_id, "user_id": user_id, "username": username},
            room=room
        )
        return {"status": "joined", "session_id": session_id}
    finally:
        db.close()


@sio.event
async def pomodoro_tick(sid: str, data: Dict[str, Any]):
    """Sync Pomodoro timer tick with other pod members in the room."""
    pod_id = data.get("pod_id")
    remaining_seconds = data.get("remaining_seconds", 0)
    timer_status = data.get("status", "running")

    if not pod_id:
        return {"error": "Missing pod_id"}

    room = f"pod_{pod_id}"
    await sio.emit(
        "pomodoro_tick_sync",
        {
            "pod_id": pod_id,
            "remaining_seconds": remaining_seconds,
            "status": timer_status
        },
        room=room,
        skip_sid=sid
    )
    return {"status": "synced"}


@sio.event
async def typing(sid: str, data: Dict[str, Any]):
    """Broadcast typing indicator to other pod members."""
    pod_id = data.get("pod_id")
    is_typing = data.get("is_typing", True)

    if not pod_id:
        return {"error": "Missing pod_id"}

    session = await sio.get_session(sid)
    username = session.get("username", "Member") if session else "Member"

    room = f"pod_{pod_id}"
    await sio.emit(
        "user_typing",
        {"pod_id": pod_id, "username": username, "is_typing": is_typing},
        room=room,
        skip_sid=sid
    )
