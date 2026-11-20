import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pod_id = Column(String(36), ForeignKey("study_pods.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # null = AI bot
    content = Column(Text, nullable=False)
    message_type = Column(String(30), default="text")  # text, system, ai_coach, milestone_update, pomodoro_invite
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    pod = relationship("StudyPod", back_populates="messages")
    user = relationship("User", back_populates="messages")
