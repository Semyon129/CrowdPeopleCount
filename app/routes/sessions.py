from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app import models, schemas

router = APIRouter()

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=schemas.SessionOut)
async def create_session(session_data: schemas.SessionCreate, db: AsyncSession = Depends(get_db)):
    new_session = models.Session(**session_data.dict())
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return new_session

@router.get("/", response_model=list[schemas.SessionOut])
async def get_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(models.Session.__table__.select())
    return result.scalars().all()
