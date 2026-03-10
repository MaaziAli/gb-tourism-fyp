from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    full_name: str
    email: EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"


class UserResponse(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}
