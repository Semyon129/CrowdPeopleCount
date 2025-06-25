from fastapi import FastAPI
from app.routes import users, rooms, sessions, detections, auth
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import admin
import logging
from fastapi import Depends, HTTPException, status
app = FastAPI(title="Attendance Counter System")

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

app.include_router(admin.admin_router)
app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
app.include_router(detections.router, prefix="/detections", tags=["Detections"])

# HTML страницы

@app.get("/admin-panel", response_class=HTMLResponse)
async def admin_panel():
    with open("frontend/html/admin_panel.html", encoding="utf-8") as f:
        return f.read()
    
@app.get("/", response_class=HTMLResponse)
async def login_page():
    with open("frontend/html/login_page.html", encoding="utf-8") as f:
        return f.read()

@app.get("/admin-statistics", response_class=HTMLResponse)
async def admin_statistics():
    with open("frontend/html/admin_statistics.html", encoding="utf-8") as f:
        return f.read()

# @app.get("/user-panel", response_class=HTMLResponse)
# async def user_panel():
#     with open("frontend/html/user_panel.html", encoding="utf-8") as f:
#         return f.read()

@app.get("/user-statistics", response_class=HTMLResponse)
async def user_statistics():
    with open("frontend/html/user_statistics.html", encoding="utf-8") as f:
        return f.read()

@app.get("/add-a-user", response_class=HTMLResponse)
async def add_a_user():
    with open("frontend/html/add_a_user.html", encoding="utf-8") as f:
        return f.read()

@app.get("/add-an-audience", response_class=HTMLResponse)
async def add_an_audience():
    with open("frontend/html/add_an_audience.html", encoding="utf-8") as f:
        return f.read()

@app.get("/audience-admin-panel", response_class=HTMLResponse)
async def audience_admin_panel():
    with open("frontend/html/audience_(admin_panel).html", encoding="utf-8") as f:
        return f.read()
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
logging.basicConfig(level=logging.DEBUG)

# Добавьте в main.py
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/test_db")
async def test_db():
    try:
        # Простейший запрос к БД
        result = await db.execute("SELECT 1")
        return {"db_status": "ok", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))