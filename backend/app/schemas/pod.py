from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class PodCreate(BaseModel):
    exam_category: str


class PodMemberResponse(BaseModel):
    user_id: str
    username: str
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PodResponse(BaseModel):
    id: str
    name: str
    exam_category: str
    created_at: datetime
    is_active: bool
    rotation_date: Optional[datetime] = None
    members: List[PodMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)


class QueueStatusResponse(BaseModel):
    position: int
    exam_category: str
    estimated_wait: str
