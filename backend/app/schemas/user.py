from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "tester"   # admin | manager | tester | developer


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    organization_id: str
    full_name: str
    email: str
    role: str
    is_active: bool
    must_change_password: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True