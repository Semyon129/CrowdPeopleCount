from fastapi import FastAPI
from app.routes import users, rooms, sessions, detections

app = FastAPI(title="Attendance Counter System")

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(detections.router, prefix="/detections", tags=["Detections"])

@app.get("/")
async def root():
    return {"message": "Система подсчета студентов работает!"}
