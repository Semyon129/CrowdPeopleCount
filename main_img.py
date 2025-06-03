import cv2
import requests
import datetime
import time
import os
from ultralytics import YOLO

# Настройки
TEST_IMAGES_DIR = "test_images"  # Папка с изображениями
BACKEND_URL = "http://127.0.0.1:8000/detections/"
SCHEDULED_TIMES = ["09:00", "10:45", "12:30", "14:45", "16:30", "18:15", "20:00"]

# Загрузка модели YOLOv5
model = YOLO('best.pt')


def count_people(image_path):
    """Считает людей на изображении."""
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Ошибка: не удалось загрузить {image_path}!")
        return 0

    # results = model.predict(frame)
    # people = [obj for obj in results if obj.class_id == 0]  # Фильтр по классу 'person'

    results = model(frame)
    people = [obj for obj in results[0].boxes.data if int(obj[-1]) == 1]

    return len(people)


def send_to_backend(audience_id, count):
    """Отправляет данные на сервер."""
    payload = {
        "room_id": audience_id,  # важно: именно room_id
        "count": count,
        "timestamp": datetime.datetime.now().isoformat()
    }

    print(f"Sending to: {BACKEND_URL}")
    import json
    print(json.dumps(payload))
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(BACKEND_URL, json=payload, headers=headers, timeout=3)
        print(f"Данные для {audience_id} отправлены. Статус: {response.status_code}")
    except Exception as e:
        print(f"Ошибка отправки ({audience_id}): {e}")



def check_schedule():
    """Проверяет, наступило ли время выполнения."""
    current_time = datetime.datetime.now().strftime("%H:%M")
    return current_time in SCHEDULED_TIMES


def process_audience(audience_id, image_path):
    """Обрабатывает изображение для 'аудитории'."""
    if not os.path.exists(image_path):
        print(f"Изображение {image_path} не найдено!")
        return

    # if check_schedule():
    people_count = count_people(image_path)
    print(f"[{datetime.datetime.now()}] {audience_id}: людей = {people_count}")
    send_to_backend(audience_id, people_count)


if __name__ == "__main__":
    AUDIENCES = {
        "ri502": os.path.join(TEST_IMAGES_DIR, "crowd1.jpg"),
        "ri333": os.path.join(TEST_IMAGES_DIR, "crowd2.jpg"),
    }

    os.makedirs(TEST_IMAGES_DIR, exist_ok=True)

    while True:
        for aud_id, img_path in AUDIENCES.items():
            process_audience(aud_id, img_path)

        time.sleep(60)