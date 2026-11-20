from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ChatMessageCreate(BaseModel):
    pod_id: str
    content: str


class ChatMessageResponse(BaseModel):
    id: str
    pod_id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    content: str
    message_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
