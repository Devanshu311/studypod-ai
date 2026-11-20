import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.pod import StudyPod, PodMembership
from app.models.chat import ChatMessage
from app.models.user import User
from app.services.ai_coach import generate_welcome_message

ADJECTIVES = [
    "Quantum", "Binary", "Algo", "Cyber", "Neural",
    "Stellar", "Agile", "Radiant", "Apex", "Prime",
    "Turbo", "Logic", "Cosmic", "Epic", "Infinite",
    "Matrix", "Vector", "Proton", "Dynamo", "Zen"
]

NOUNS = [
    "Quizzers", "Brainiacs", "Avengers", "Scholars", "Titans",
    "Squad", "Pioneers", "Guild", "Voyagers", "Knights",
    "Champions", "Syndicate", "Wizards", "Collective", "Hackers",
    "Masterminds", "Seekers", "Explorers", "Legends", "Navigators"
]

# In-memory matching queue keyed by exam_category: { exam_category: [user_id, ...] }
matching_queues: Dict[str, List[str]] = {}


def generate_pod_name() -> str:
    """Generate a random fun study pod name."""
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    return f"{adj} {noun}"


def get_queue_position(user_id: str, exam_category: str) -> int:
    """Return the 1-based position in queue for a user, or -1 if not queued."""
    queue = matching_queues.get(exam_category, [])
    if user_id in queue:
        return queue.index(user_id) + 1
    return 1


def remove_from_queue(user_id: str, exam_category: Optional[str] = None) -> bool:
    """Remove a user from a specific queue or all queues."""
    removed = False
    if exam_category:
        queue = matching_queues.get(exam_category, [])
        if user_id in queue:
            queue.remove(user_id)
            removed = True
    else:
        for cat, queue in matching_queues.items():
            if user_id in queue:
                queue.remove(user_id)
                removed = True
    return removed


def add_to_queue(user_id: str, exam_category: str, db: Session) -> Dict[str, Any]:
    """
    Smart Instant Matchmaker:
    1. Checks if an active pod exists for this exam with room (< 4 members).
    2. If found, joins immediately!
    3. If not, checks any active pod on the platform with space.
    4. If none have space, creates an active Pod right away and matches with
       active peers so students can study immediately without waiting!
    """
    current_user = db.query(User).filter(User.id == user_id).first()
    user_name = current_user.username if current_user else "Peer"

    # Step 1: Check existing pods for this exam category with space (< 4 members)
    existing_pods = db.query(StudyPod).filter(
        StudyPod.exam_category == exam_category,
        StudyPod.is_active == True
    ).all()

    for pod in existing_pods:
        is_member = any(m.user_id == user_id for m in pod.members)
        if is_member:
            return {
                "matched": True,
                "pod": pod,
                "position": 0,
                "exam_category": exam_category,
            }

        if len(pod.members) < 4:
            new_membership = PodMembership(
                id=str(uuid.uuid4()),
                user_id=user_id,
                pod_id=pod.id,
                role="member"
            )
            db.add(new_membership)

            sys_msg = ChatMessage(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=None,
                content=f"👋 @{user_name} has joined the Study Pod! Welcome!",
                message_type="system"
            )
            db.add(sys_msg)
            db.commit()
            db.refresh(pod)
            return {
                "matched": True,
                "pod": pod,
                "position": 0,
                "exam_category": exam_category,
            }

    # Step 2: Check any other active study pod with space (< 4 members)
    all_active_pods = db.query(StudyPod).filter(StudyPod.is_active == True).all()
    for pod in all_active_pods:
        is_member = any(m.user_id == user_id for m in pod.members)
        if not is_member and len(pod.members) < 4:
            new_membership = PodMembership(
                id=str(uuid.uuid4()),
                user_id=user_id,
                pod_id=pod.id,
                role="member"
            )
            db.add(new_membership)
            sys_msg = ChatMessage(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=None,
                content=f"👋 @{user_name} from {exam_category} joined the pod to study together!",
                message_type="system"
            )
            db.add(sys_msg)
            db.commit()
            db.refresh(pod)
            return {
                "matched": True,
                "pod": pod,
                "position": 0,
                "exam_category": exam_category,
            }

    # Step 3: Create a fresh pod immediately with peers so the user is never alone
    pod_name = generate_pod_name()
    new_pod = StudyPod(
        id=str(uuid.uuid4()),
        name=f"The {exam_category} {pod_name}",
        exam_category=exam_category,
        created_at=datetime.utcnow(),
        is_active=True,
        rotation_date=datetime.utcnow() + timedelta(days=30),
    )
    db.add(new_pod)
    db.flush()

    # Add user as leader
    db.add(PodMembership(
        id=str(uuid.uuid4()),
        user_id=user_id,
        pod_id=new_pod.id,
        role="leader"
    ))

    # Add up to 2 other peers from the platform so the pod is active
    other_users = db.query(User).filter(User.id != user_id).limit(2).all()
    for ou in other_users:
        db.add(PodMembership(
            id=str(uuid.uuid4()),
            user_id=ou.id,
            pod_id=new_pod.id,
            role="member"
        ))

    welcome_content = generate_welcome_message(new_pod)
    welcome_msg = ChatMessage(
        id=str(uuid.uuid4()),
        pod_id=new_pod.id,
        user_id=None,
        content=welcome_content,
        message_type="ai_coach",
        created_at=datetime.utcnow(),
    )
    db.add(welcome_msg)
    db.commit()
    db.refresh(new_pod)

    return {
        "matched": True,
        "pod": new_pod,
        "position": 0,
        "exam_category": exam_category,
    }
