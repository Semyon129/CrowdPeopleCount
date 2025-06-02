from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app import models, schemas
from app.database import get_db
from app.security import get_current_user

admin_router = APIRouter(prefix="/admin", tags=["Admin"])

@admin_router.post("/users", response_model=schemas.UserOut)
async def create_user_by_admin(
    new_user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав")

    result = await db.execute(select(models.User).where(models.User.email == new_user.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    user = models.User(
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        password_hash=models.User.hash_password(new_user.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user
