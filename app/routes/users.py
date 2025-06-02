from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import SessionLocal
from app import models, schemas
from app.security import get_password_hash
from sqlalchemy import select

router = APIRouter()

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=schemas.UserOut)
async def create_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        login=user.login,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/", response_model=list[schemas.UserOut])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    return users

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}

@router.get("/{user_id}", response_model=schemas.UserOut)
async def get_user_by_id(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

from fastapi import Path

@router.put("/{user_id}", response_model=schemas.UserOut)
async def update_user(user_id: int, user_data: schemas.UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Обновляем поля
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.login is not None:
        user.login = user_data.login
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.password:
        user.password_hash = get_password_hash(user_data.password)

    await db.commit()
    await db.refresh(user)
    return user

