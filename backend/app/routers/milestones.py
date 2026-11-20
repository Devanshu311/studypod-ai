from datetime import date, datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat import ChatMessage
from app.models.milestone import Milestone
from app.models.pod import PodMembership, StudyPod
from app.models.study_log import StudyLog
from app.models.user import User
from app.schemas.milestone import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from app.utils.security import get_current_user

router = APIRouter(prefix="", tags=["Milestones"])

VALID_STATUSES = {"pending", "in_progress", "completed", "overdue"}


@router.post("/", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    milestone_in: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new study milestone for a pod."""
    pod = db.query(StudyPod).filter(StudyPod.id == milestone_in.pod_id).first()
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study pod not found"
        )

    # Check user membership
    membership = db.query(PodMembership).filter(
        PodMembership.pod_id == milestone_in.pod_id,
        PodMembership.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this study pod"
        )

    milestone = Milestone(
        pod_id=milestone_in.pod_id,
        user_id=current_user.id,
        title=milestone_in.title,
        description=milestone_in.description,
        due_date=milestone_in.due_date,
        status="pending",
        created_by="user",
        created_at=datetime.utcnow()
    )
    db.add(milestone)
    db.flush()

    # Post an announcement in the pod chat
    due_str = milestone.due_date.strftime("%b %d, %Y")
    chat = ChatMessage(
        pod_id=milestone.pod_id,
        user_id=current_user.id,
        content=f"🎯 New Milestone: '{milestone.title}' set by @{current_user.username} (Due: {due_str})",
        message_type="milestone_update",
        created_at=datetime.utcnow()
    )
    db.add(chat)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("/pod/{pod_id}", response_model=List[MilestoneResponse])
def get_pod_milestones(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all milestones for a specific pod."""
    pod = db.query(StudyPod).filter(StudyPod.id == pod_id).first()
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study pod not found"
        )

    milestones = db.query(Milestone).filter(
        Milestone.pod_id == pod_id
    ).order_by(Milestone.due_date.asc()).all()

    return milestones


@router.patch("/{milestone_id}/status", response_model=MilestoneResponse)
def update_milestone_status(
    milestone_id: str,
    status_update: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update milestone status (pending, in_progress, completed, overdue)."""
    target_status = status_update.status.lower().strip()
    if target_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{target_status}'. Must be one of {list(VALID_STATUSES)}"
        )

    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )

    prev_status = milestone.status
    milestone.status = target_status

    # If completed just now, credit user's today study log
    if target_status == "completed" and prev_status != "completed":
        today = date.today()
        study_log = db.query(StudyLog).filter(
            StudyLog.user_id == current_user.id,
            StudyLog.date == today
        ).first()

        if not study_log:
            study_log = StudyLog(
                user_id=current_user.id,
                date=today,
                minutes_studied=0,
                milestones_completed=1,
                streak_count=0
            )
            db.add(study_log)
        else:
            study_log.milestones_completed += 1

        # Post completion event to pod chat
        chat = ChatMessage(
            pod_id=milestone.pod_id,
            user_id=current_user.id,
            content=f"🎉 Milestone completed by @{current_user.username}: '{milestone.title}'! Great work!",
            message_type="milestone_update",
            created_at=datetime.utcnow()
        )
        db.add(chat)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("/my", response_model=List[MilestoneResponse])
def get_my_milestones(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all milestones assigned to or created by the current user."""
    milestones = db.query(Milestone).filter(
        Milestone.user_id == current_user.id
    ).order_by(Milestone.due_date.asc()).all()

    return milestones
