from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PomodoroCreate(BaseModel):
    pod_id: str
    duration_minutes: int = Field(default=25, ge=1, le=180)
    break_minutes: int = Field(default=5, ge=1, le=60)


class PomodoroParticipantResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    username: Optional[str] = None
    joined_at: datetime
    completed: bool
    focus_score: float

    model_config = ConfigDict(from_attributes=True)


class PomodoroResponse(BaseModel):
    id: str
    pod_id: str
    initiated_by: str
    started_at: datetime
    duration_minutes: int
    break_minutes: int
    status: str
    participants: List[PomodoroParticipantResponse] = []

    model_config = ConfigDict(from_attributes=True)
