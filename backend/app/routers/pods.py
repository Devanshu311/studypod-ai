import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.pod import StudyPod, PodMembership
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.pod import PodCreate, PodMemberResponse, PodResponse, QueueStatusResponse
from app.services.matching import add_to_queue, get_queue_position, remove_from_queue
from app.utils.security import get_current_user

router = APIRouter(prefix="", tags=["Study Pods"])


def _format_pod_response(pod: StudyPod) -> PodResponse:
    """Helper to convert a StudyPod ORM model into PodResponse schema."""
    members = []
    for m in pod.members:
        members.append(
            PodMemberResponse(
                user_id=m.user_id,
                username=m.user.username if m.user else "Unknown",
                role=m.role,
                joined_at=m.joined_at,
            )
        )
    return PodResponse(
        id=pod.id,
        name=pod.name,
        exam_category=pod.exam_category,
        created_at=pod.created_at,
        is_active=pod.is_active,
        rotation_date=pod.rotation_date,
        members=members,
    )


@router.post("/join-queue")
def join_matching_queue(
    pod_in: Optional[PodCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add current user to matching queue for their exam category.
    If 4 users gather, a new pod is automatically created.
    """
    exam_category = (pod_in.exam_category if pod_in and pod_in.exam_category else current_user.target_exam).strip()
    result = add_to_queue(current_user.id, exam_category, db)

    if result.get("matched") and result.get("pod"):
        matched_pod = result["pod"]
        return {
            "status": "matched",
            "message": f"Congratulations! You were matched into pod '{matched_pod.name}'.",
            "pod": _format_pod_response(matched_pod),
            "position": 0,
            "estimated_wait": "0 mins"
        }

    pos = result.get("position", 1)
    needed = max(1, 4 - (pos % 4 if pos % 4 != 0 else 4))
    return {
        "status": "queued",
        "message": f"You are in queue for {exam_category}. Looking for {needed} more peer(s).",
        "pod": None,
        "position": pos,
        "exam_category": exam_category,
        "estimated_wait": f"~{needed * 2} minutes"
    }


@router.get("/queue-status", response_model=QueueStatusResponse)
def get_user_queue_status(
    exam_category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Check current queue position for the user."""
    target_category = (exam_category or current_user.target_exam).strip()
    pos = get_queue_position(current_user.id, target_category)

    if pos <= 0:
        return QueueStatusResponse(
            position=0,
            exam_category=target_category,
            estimated_wait="Not currently queued"
        )

    needed = max(1, 4 - (pos % 4 if pos % 4 != 0 else 4))
    return QueueStatusResponse(
        position=pos,
        exam_category=target_category,
        estimated_wait=f"{needed} more member(s) needed (~{needed * 2} mins)"
    )


@router.get("/my-pods", response_model=List[PodResponse])
def get_my_pods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all active pods the current user is a member of."""
    memberships = db.query(PodMembership).filter(
        PodMembership.user_id == current_user.id
    ).all()

    active_pods = [
        _format_pod_response(m.pod)
        for m in memberships
        if m.pod and m.pod.is_active
    ]
    return active_pods


@router.get("/{pod_id}", response_model=PodResponse)
def get_pod_details(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details and members of a specific study pod."""
    pod = db.query(StudyPod).filter(StudyPod.id == pod_id).first()
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study pod not found"
        )

    # Ensure user is a member or has access
    is_member = any(m.user_id == current_user.id for m in pod.members)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this study pod"
        )

    return _format_pod_response(pod)


@router.post("/{pod_id}/leave")
def leave_pod(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a study pod. If no members remain, the pod is deactivated."""
    membership = db.query(PodMembership).filter(
        PodMembership.pod_id == pod_id,
        PodMembership.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found for this pod"
        )

    db.delete(membership)
    db.flush()

    # Check remaining members
    remaining = db.query(PodMembership).filter(PodMembership.pod_id == pod_id).count()
    pod = db.query(StudyPod).filter(StudyPod.id == pod_id).first()
    if pod and remaining == 0:
        pod.is_active = False

    db.commit()
    return {"message": "Successfully left the study pod", "pod_id": pod_id}


@router.post("/join/{pod_id}")
def join_pod_by_id(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join an existing study pod using an invite link or pod ID."""
    pod = db.query(StudyPod).filter(StudyPod.id == pod_id.strip()).first()
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study pod not found with this invite code"
        )

    # Check if already a member
    existing = db.query(PodMembership).filter(
        PodMembership.pod_id == pod.id,
        PodMembership.user_id == current_user.id
    ).first()
    if existing:
        return {
            "message": "You are already a member of this study pod!",
            "pod": _format_pod_response(pod)
        }

    # Check max 4 members limit
    current_count = db.query(PodMembership).filter(PodMembership.pod_id == pod.id).count()
    if current_count >= 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This study pod is already full (maximum 4 members reached)!"
        )

    # Add member
    membership = PodMembership(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        pod_id=pod.id,
        role="member"
    )
    db.add(membership)

    # Announce new member in pod chat
    sys_msg = ChatMessage(
        id=str(uuid.uuid4()),
        pod_id=pod.id,
        user_id=None,
        content=f"👋 Welcome @{current_user.username} who joined the pod via invite link! Say hi!",
        message_type="system"
    )
    db.add(sys_msg)
    db.commit()
    db.refresh(pod)

    return {
        "message": f"Successfully joined '{pod.name}'!",
        "pod": _format_pod_response(pod)
    }

