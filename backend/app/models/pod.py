import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.database import Base


class StudyPod(Base):
    __tablename__ = "study_pods"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    exam_category = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    rotation_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    members = relationship("PodMembership", back_populates="pod", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="pod", cascade="all, delete-orphan")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="pod", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="pod", cascade="all, delete-orphan")


class PodMembership(Base):
    __tablename__ = "pod_memberships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pod_id = Column(String(36), ForeignKey("study_pods.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    role = Column(String(20), default="member")  # member or leader

    # Relationships
    user = relationship("User", back_populates="memberships")
    pod = relationship("StudyPod", back_populates="members")
