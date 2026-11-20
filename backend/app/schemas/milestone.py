from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    pod_id: str


class MilestoneUpdate(BaseModel):
    status: str  # pending, in_progress, completed, overdue


class MilestoneResponse(BaseModel):
    id: str
    pod_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    due_date: datetime
    status: str
    created_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
