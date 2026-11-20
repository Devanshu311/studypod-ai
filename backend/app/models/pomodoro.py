import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pod_id = Column(String(36), ForeignKey("study_pods.id", ondelete="CASCADE"), nullable=False)
    initiated_by = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    duration_minutes = Column(Integer, default=25)
    break_minutes = Column(Integer, default=5)
    status = Column(String(20), default="active")  # active, completed, cancelled

    # Relationships
    pod = relationship("StudyPod", back_populates="pomodoro_sessions")
    initiator = relationship("User", foreign_keys=[initiated_by])
    participants = relationship("PomodoroParticipant", back_populates="session", cascade="all, delete-orphan")


class PomodoroParticipant(Base):
    __tablename__ = "pomodoro_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("pomodoro_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed = Column(Boolean, default=False)
    focus_score = Column(Float, default=0.0)

    # Relationships
    session = relationship("PomodoroSession", back_populates="participants")
    user = relationship("User", back_populates="pomodoro_participants")
