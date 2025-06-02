from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app import models, schemas
from typing import List
from sqlalchemy.future import select
from app.schemas import DetectionOut
from app.models import Detection
router = APIRouter()

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=schemas.DetectionOut)
async def create_detection(data: schemas.DetectionCreate, db: AsyncSession = Depends(get_db)):
    new_detection = models.Detection(**data.dict())
    db.add(new_detection)
    await db.commit()
    await db.refresh(new_detection)
    return new_detection

@router.get("/", response_model=List[DetectionOut])
async def get_detections(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Detection))
    detections = result.scalars().all()
    return detections  # <-- это важно, возвращай список объектов
