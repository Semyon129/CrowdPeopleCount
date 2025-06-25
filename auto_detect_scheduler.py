import os
import time
import schedule
from datetime import datetime
from app.yolo_detector import count_people
from app.models import Detection
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import cv2
# Загрузим переменные окружения
load_dotenv()

# База данных (синхронный движок!)
DATABASE_URL = os.getenv("DATABASE_URL_SYNC")  # обязательно в .env
WINDOW_WIDTH = 640
WINDOW_HEIGHT = 480
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

ROOM_ID = "РИ-502"
IMAGE_DIR = "test_images"

TIME_TO_FILENAME = {
    "09:00": "crowd1.jpg",
    "10:45": "crowd2.jpg",
    "12:30": "crowd1.jpg",
    "14:45": "crowd2.jpg",
    "16:30": "crowd1.jpg",
    "18:15": "crowd2.jpg",
    "20:00": "crowd1.jpg",
}

def detect_and_save(time_str):
    filename = TIME_TO_FILENAME[time_str]
    path = os.path.join(IMAGE_DIR, filename)

    if not os.path.exists(path):
        print(f"⛔ Файл не найден: {path}")
        return

    try:
        count = count_people(path)
        db = SessionLocal()
        detection = Detection(
            room_id=ROOM_ID,
            count=count,
            timestamp=datetime.now()
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)
        db.close()

        print(f"✅ {time_str}: Сохранено {count} человек из файла {filename}")

    except Exception as e:
        print(f"Ошибка при обработке {filename}: {e}")

# Настроим расписание
for time_str in TIME_TO_FILENAME.keys():
    schedule.every().day.at(time_str).do(detect_and_save, time_str)

print("Планировщик автодетекции запущен.")
while True:
    schedule.run_pending()
    time.sleep(1)
