from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Users
class UserCreate(BaseModel):
    name: str
    email: str
    login: str
    password: str
    role: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    login: str
    role: str
    created_at: datetime
        
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: Optional[str]
    email: Optional[str]
    login: Optional[str]
    role: Optional[str]
    password: Optional[str] = None

# Rooms
class RoomCreate(BaseModel):
    name: str
    capacity: int

class RoomOut(BaseModel):
    id: int
    name: str
    capacity: int  # ← вот это поле не хватало

    class Config:
        from_attributes = True  # если используешь SQLAlchemy ORM


# Sessions
class SessionCreate(BaseModel):
    room_id: int
    teacher_id: int
    subject: str
    start_time: datetime
    end_time: datetime

class SessionOut(SessionCreate):
    id: int
    class Config:
        orm_mode = True

# Detections
class DetectionCreate(BaseModel):
    room_id: str
    count: int
    timestamp: datetime

class DetectionOut(BaseModel):
    id: int
    room_id: str
    count: int
    timestamp: datetime

    class Config:
        orm_mode = True
class Token(BaseModel):
    access_token: str
    token_type: str

