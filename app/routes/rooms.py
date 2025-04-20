from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app import models, schemas

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

@router.get("/", response_model=list[schemas.RoomOut])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(models.Room.__table__.select())
    return result.scalars().all()
