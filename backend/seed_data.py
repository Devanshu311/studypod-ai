"""
Seed script to populate initial demo data into StudyPod AI database.
Run this script to verify that database tables and relationships are storing data properly.
"""
import uuid
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.pod import StudyPod, PodMembership
from app.models.milestone import Milestone
from app.models.chat import ChatMessage
from app.models.study_log import StudyLog
from app.utils.security import hash_password

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_user = db.query(User).filter_by(email="arjun@example.com").first()
        if existing_user:
            print("Database already contains demo data! Skipping seed.")
            return

        print("Seeding demo data into database...")

        # 1. Create 4 Demo Students for a Study Pod
        students_data = [
            ("arjun@example.com", "arjun_cs", "IIT Bombay", "GATE CS", ["Data Structures", "Algorithms", "Operating Systems"]),
            ("priya@example.com", "priya_ai", "BITS Pilani", "GATE CS", ["Algorithms", "Computer Networks", "DBMS"]),
            ("rohit@example.com", "rohit_dev", "DTU Delhi", "GATE CS", ["Theory of Computation", "Compiler Design", "COA"]),
            ("sneha@example.com", "sneha_tech", "NIT Trichy", "GATE CS", ["Operating Systems", "Discrete Maths", "Digital Logic"])
        ]

        users = []
        for email, username, uni, exam, subjects in students_data:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                username=username,
                password_hash=hash_password("Password123!"),
                university=uni,
                target_exam=exam,
                subjects=subjects,
                study_hours_goal=120,
                is_premium=True if username == "arjun_cs" else False
            )
            db.add(user)
            users.append(user)
            
            # Initial Study Log
            log = StudyLog(
                id=str(uuid.uuid4()),
                user_id=user.id,
                date=datetime.utcnow().date(),
                minutes_studied=95,
                milestones_completed=2,
                streak_count=5
            )
            db.add(log)

        db.commit()

        # 2. Create Study Pod
        pod = StudyPod(
            id=str(uuid.uuid4()),
            name="The Quantum Algorithms Pod",
            exam_category="GATE CS",
            is_active=True,
            rotation_date=datetime.utcnow() + timedelta(days=14)
        )
        db.add(pod)
        db.commit()

        # 3. Add Memberships
        for idx, user in enumerate(users):
            membership = PodMembership(
                id=str(uuid.uuid4()),
                user_id=user.id,
                pod_id=pod.id,
                role="leader" if idx == 0 else "member"
            )
            db.add(membership)

        # 4. Create Milestones
        milestones = [
            Milestone(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=users[0].id,
                title="Master Dynamic Programming & Graph Algorithms",
                description="Complete 25 practice questions on LeetCode/GeeksforGeeks",
                due_date=datetime.utcnow() + timedelta(days=2),
                status="in_progress",
                created_by="user"
            ),
            Milestone(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=users[1].id,
                title="Review Operating System Memory Management",
                description="Paging, Segmentation, and Virtual Memory deep dive",
                due_date=datetime.utcnow() + timedelta(days=4),
                status="pending",
                created_by="ai"
            ),
            Milestone(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=users[2].id,
                title="Solve 10 Previous Year GATE DBMS Questions",
                description="Relational Algebra and B+ Tree indexing problems",
                due_date=datetime.utcnow() - timedelta(days=1),
                status="completed",
                created_by="user"
            )
        ]
        db.add_all(milestones)

        # 5. Add Initial Chat Messages
        messages = [
            ChatMessage(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=None,
                content="Welcome to your new Study Pod: The Quantum Algorithms Pod! 🚀 I'm your AI Study Coach StudyBot. Let's conquer GATE CS together!",
                message_type="ai_coach"
            ),
            ChatMessage(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=users[0].id,
                content="Hey everyone! Excited to study together. Who's up for a 50-minute Pomodoro sprint tonight?",
                message_type="text"
            ),
            ChatMessage(
                id=str(uuid.uuid4()),
                pod_id=pod.id,
                user_id=users[1].id,
                content="Count me in! I'm reviewing Dijkstra and Floyd-Warshall algorithms.",
                message_type="text"
            )
        ]
        db.add_all(messages)
        db.commit()

        print("✅ Demo data seeded successfully!")
        print(f"Created 4 users in pod '{pod.name}' with initial milestones and chat history.")
        print(f"Demo Login: Email: arjun@example.com | Password: Password123!")

    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
