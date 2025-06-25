from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app import models, schemas
from typing import List, Optional
from sqlalchemy.future import select
from app.schemas import DetectionOut
from app.models import Detection
from fastapi import Depends, HTTPException, status
from fastapi import UploadFile, File
import shutil
import os
from datetime import datetime
from app.yolo_detector import count_people
from fastapi import Query
router = APIRouter()
from datetime import date
from sqlalchemy import func
from datetime import date as date_type
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app import models, schemas
from app.database import get_db
async def get_db():
    async with SessionLocal() as session:
        yield session


@router.post("/", response_model=schemas.DetectionOut)
async def detect_and_create_detection(
    room_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Сохраняем файл
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Запускаем YOLO
    try:
        count = count_people(temp_path)
    except Exception as e:
        os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Ошибка при детекции: {str(e)}")

    os.remove(temp_path)

    # Сохраняем в БД
    new_detection = models.Detection(
        room_id=room_id,
        count=count,
        timestamp=datetime.utcnow()
    )

    try:
        db.add(new_detection)
        await db.commit()
        await db.refresh(new_detection)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return new_detection




@router.get("/", response_model=List[schemas.DetectionOut])
async def get_filtered_detections(
    room_id: str,
    date: date,
    db: AsyncSession = Depends(get_db)
):
    try:
        stmt = select(models.Detection).where(
            models.Detection.room_id == room_id,
            func.date(models.Detection.timestamp) == date
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))