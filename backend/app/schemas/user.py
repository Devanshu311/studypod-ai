from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str
    target_exam: str
    subjects: List[str] = Field(default_factory=list)
    university: Optional[str] = None
    study_hours_goal: Optional[int] = 120


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    university: Optional[str] = None
    target_exam: str
    subjects: Optional[List[str]] = Field(default_factory=list)
    study_hours_goal: int
    is_premium: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    refresh_token: str
