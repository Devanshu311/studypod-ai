import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.pod import StudyPod, PodMembership
from app.models.chat import ChatMessage
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
    return -1


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


def check_and_match(exam_category: str, db: Session) -> Optional[StudyPod]:
    """
    Check if the queue for an exam category has 4 or more users.
    If so, pop 4 users, create a StudyPod, assign memberships, and post a welcome message.
    """
    queue = matching_queues.setdefault(exam_category, [])
    if len(queue) < 4:
        return None

    # Pop 4 users
    matched_user_ids = [queue.pop(0) for _ in range(4)]

    # Create Pod
    pod_name = generate_pod_name()
    new_pod = StudyPod(
        name=pod_name,
        exam_category=exam_category,
        created_at=datetime.utcnow(),
        is_active=True,
        rotation_date=datetime.utcnow() + timedelta(days=30),
    )
    db.add(new_pod)
    db.flush()  # populate new_pod.id

    # Create memberships (first user leader, others members)
    for idx, uid in enumerate(matched_user_ids):
        membership = PodMembership(
            user_id=uid,
            pod_id=new_pod.id,
            joined_at=datetime.utcnow(),
            role="leader" if idx == 0 else "member",
        )
        db.add(membership)

    # Generate initial welcome message from StudyBot
    welcome_content = generate_welcome_message(new_pod)
    welcome_msg = ChatMessage(
        pod_id=new_pod.id,
        user_id=None,
        content=welcome_content,
        message_type="ai_coach",
        created_at=datetime.utcnow(),
    )
    db.add(welcome_msg)

    db.commit()
    db.refresh(new_pod)
    return new_pod


def add_to_queue(user_id: str, exam_category: str, db: Session) -> Dict[str, Any]:
    """
    Add a user to the matching queue and immediately check if a pod can be formed.
    Returns status info including position or matched pod.
    """
    queue = matching_queues.setdefault(exam_category, [])

    # If already in queue, don't add again
    if user_id not in queue:
        queue.append(user_id)

    # Attempt matching
    matched_pod = check_and_match(exam_category, db)
    if matched_pod:
        return {
            "matched": True,
            "pod": matched_pod,
            "position": 0,
            "exam_category": exam_category,
        }

    pos = queue.index(user_id) + 1
    return {
        "matched": False,
        "pod": None,
        "position": pos,
        "exam_category": exam_category,
    }
