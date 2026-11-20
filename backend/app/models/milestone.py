import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pod_id = Column(String(36), ForeignKey("study_pods.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending")  # pending, in_progress, completed, overdue
    created_by = Column(String(20), default="user")  # user, ai
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    pod = relationship("StudyPod", back_populates="milestones")
    user = relationship("User", back_populates="milestones")
