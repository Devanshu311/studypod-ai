from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat import ChatMessage
from app.models.pod import PodMembership, StudyPod
from app.models.pomodoro import PomodoroParticipant, PomodoroSession
from app.models.study_log import StudyLog
from app.models.user import User
from app.schemas.pomodoro import PomodoroCreate, PomodoroParticipantResponse, PomodoroResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="", tags=["Pomodoro"])


def _format_pomodoro_response(session: PomodoroSession, db: Session) -> PomodoroResponse:
    """Helper to convert PomodoroSession ORM model into PomodoroResponse schema."""
    participants = []
    for p in session.participants:
        user_obj = db.query(User).filter(User.id == p.user_id).first()
        participants.append(
            PomodoroParticipantResponse(
                id=p.id,
                session_id=p.session_id,
                user_id=p.user_id,
                username=user_obj.username if user_obj else "Unknown",
                joined_at=p.joined_at,
                completed=p.completed,
                focus_score=p.focus_score,
            )
        )

    return PomodoroResponse(
        id=session.id,
        pod_id=session.pod_id,
        initiated_by=session.initiated_by,
        started_at=session.started_at,
        duration_minutes=session.duration_minutes,
        break_minutes=session.break_minutes,
        status=session.status,
        participants=participants,
    )


@router.post("/start", response_model=PomodoroResponse, status_code=status.HTTP_201_CREATED)
def start_pomodoro_session(
    pomodoro_in: PomodoroCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new synced Pomodoro focus session for a study pod."""
    pod = db.query(StudyPod).filter(StudyPod.id == pomodoro_in.pod_id).first()
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study pod not found"
        )

    # Check pod membership
    membership = db.query(PodMembership).filter(
        PodMembership.pod_id == pomodoro_in.pod_id,
        PodMembership.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this study pod"
        )

    # Cancel any previous active sessions in this pod
    active_sessions = db.query(PomodoroSession).filter(
        PomodoroSession.pod_id == pomodoro_in.pod_id,
        PomodoroSession.status == "active"
    ).all()
    for s in active_sessions:
        s.status = "completed"

    session = PomodoroSession(
        pod_id=pomodoro_in.pod_id,
        initiated_by=current_user.id,
        started_at=datetime.utcnow(),
        duration_minutes=pomodoro_in.duration_minutes,
        break_minutes=pomodoro_in.break_minutes,
        status="active"
    )
    db.add(session)
    db.flush()

    # Add initiator as first participant
    initiator_p = PomodoroParticipant(
        session_id=session.id,
        user_id=current_user.id,
        joined_at=datetime.utcnow(),
        completed=False,
        focus_score=100.0
    )
    db.add(initiator_p)

    # Broadcast invitation message in pod chat
    invite_msg = ChatMessage(
        pod_id=session.pod_id,
        user_id=current_user.id,
        content=f"⏱️ @{current_user.username} started a {session.duration_minutes}-min Pomodoro focus sprint! Jump in!",
        message_type="pomodoro_invite",
        created_at=datetime.utcnow()
    )
    db.add(invite_msg)

    db.commit()
    db.refresh(session)
    return _format_pomodoro_response(session, db)


@router.post("/join/{session_id}", response_model=PomodoroResponse)
def join_pomodoro_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join an ongoing Pomodoro session."""
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pomodoro session not found"
        )

    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Pomodoro session is no longer active"
        )

    # Check if user already joined
    participant = db.query(PomodoroParticipant).filter(
        PomodoroParticipant.session_id == session.id,
        PomodoroParticipant.user_id == current_user.id
    ).first()

    if not participant:
        participant = PomodoroParticipant(
            session_id=session.id,
            user_id=current_user.id,
            joined_at=datetime.utcnow(),
            completed=False,
            focus_score=100.0
        )
        db.add(participant)

        # Notify pod
        chat = ChatMessage(
            pod_id=session.pod_id,
            user_id=current_user.id,
            content=f"🤝 @{current_user.username} joined the focus sprint!",
            message_type="pomodoro_invite",
            created_at=datetime.utcnow()
        )
        db.add(chat)
        db.commit()

    db.refresh(session)
    return _format_pomodoro_response(session, db)


@router.post("/complete/{session_id}", response_model=PomodoroResponse)
def complete_pomodoro_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark the current user's participation in a Pomodoro session as completed."""
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pomodoro session not found"
        )

    participant = db.query(PomodoroParticipant).filter(
        PomodoroParticipant.session_id == session.id,
        PomodoroParticipant.user_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not joined this Pomodoro session"
        )

    if not participant.completed:
        participant.completed = True

        # Log study minutes in user's StudyLog for today
        today = date.today()
        study_log = db.query(StudyLog).filter(
            StudyLog.user_id == current_user.id,
            StudyLog.date == today
        ).first()

        if not study_log:
            study_log = StudyLog(
                user_id=current_user.id,
                date=today,
                minutes_studied=session.duration_minutes,
                milestones_completed=0,
                streak_count=1
            )
            db.add(study_log)
        else:
            study_log.minutes_studied += session.duration_minutes
            if study_log.streak_count == 0:
                study_log.streak_count = 1

    # Check if all participants completed
    all_participants = session.participants
    if all_participants and all(p.completed for p in all_participants):
        session.status = "completed"

    db.commit()
    db.refresh(session)
    return _format_pomodoro_response(session, db)


@router.get("/active/{pod_id}", response_model=PomodoroResponse)
def get_active_pomodoro_session(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the active Pomodoro session for a pod."""
    session = db.query(PomodoroSession).filter(
        PomodoroSession.pod_id == pod_id,
        PomodoroSession.status == "active"
    ).order_by(PomodoroSession.started_at.desc()).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active Pomodoro session found for this pod"
        )

    return _format_pomodoro_response(session, db)


@router.get("/history/{pod_id}", response_model=List[PomodoroResponse])
def get_pomodoro_history(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve history of Pomodoro sessions for a study pod."""
    sessions = db.query(PomodoroSession).filter(
        PomodoroSession.pod_id == pod_id
    ).order_by(PomodoroSession.started_at.desc()).limit(20).all()

    return [_format_pomodoro_response(s, db) for s in sessions]
