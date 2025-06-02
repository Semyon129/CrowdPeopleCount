from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app import models, schemas
from typing import List
from sqlalchemy.future import select
from app.schemas import RoomOut
from app.models import Room
from fastapi import HTTPException, Path

router = APIRouter()

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=schemas.RoomOut)
async def create_room(room: schemas.RoomCreate, db: AsyncSession = Depends(get_db)):
    new_room = models.Room(**room.dict())
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    return new_room

@router.get("/", response_model=List[RoomOut])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Room))
    rooms = result.scalars().all()
    return rooms

@router.delete("/{room_id}")
async def delete_room(room_id: int, db: AsyncSession = Depends(get_db)):
    room = await db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await db.delete(room)
    await db.commit()
    return {"detail": "Room deleted"}

@router.get("/{room_id}", response_model=schemas.RoomOut)
async def get_room(room_id: int = Path(...), db: AsyncSession = Depends(get_db)):
    room = await db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=schemas.RoomOut)
async def update_room(
    room_id: int,
    room_data: schemas.RoomCreate,
    db: AsyncSession = Depends(get_db)
):
    room = await db.get(models.Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    room.name = room_data.name
    room.capacity = room_data.capacity

    await db.commit()
    await db.refresh(room)
    return room