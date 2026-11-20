import uuid
from datetime import date
from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class StudyLog(Base):
    __tablename__ = "study_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    minutes_studied = Column(Integer, default=0)
    milestones_completed = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="study_logs")
