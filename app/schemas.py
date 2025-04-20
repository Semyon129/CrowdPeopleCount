from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Users
class UserCreate(BaseModel):
    name: str
    email: str
    password_hash: str
    role: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    class Config:
        orm_mode = True

# Rooms
class RoomCreate(BaseModel):
    name: str
    location: str
    camera_url: str

class RoomOut(RoomCreate):
    id: int
    class Config:
        orm_mode = True

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
    room_id: int
    timestamp: datetime
    count: int

class DetectionOut(DetectionCreate):
    id: int
    class Config:
        orm_mode = True
