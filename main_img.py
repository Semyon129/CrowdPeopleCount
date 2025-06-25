import cv2
import requests
import datetime
import time
import os
from ultralytics import YOLO

# Настройки
TEST_IMAGES_DIR = "test_images"  # Папка с изображениями
BACKEND_URL = "http://localhost:5000/api/update_count"
SCHEDULED_TIMES = ["09:00", "10:45", "12:30", "13:57", "16:04", "18:05", "20:00"]
WINDOW_WIDTH = 640  # Ширина окна для отображения
WINDOW_HEIGHT = 480  # Высота окна для отображения

model = YOLO('best.pt')


def count_people(image_path):
    """Считает людей на изображении и возвращает изображение с разметкой."""
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Ошибка: не удалось загрузить {image_path}!")
        return 0, None

    results = model(frame)
    people = [obj for obj in results[0].boxes.data if int(obj[-1]) == 0]

    # Рисуем разметку без стандартных надписей YOLO
    annotated_frame = results[0].plot(labels=False, conf=False)

    return len(people), annotated_frame


def send_to_backend(audience_id, count):
    """Отправляет данные на сервер."""
    try:
        response = requests.post(
            BACKEND_URL,
            json={
                "audience_id": audience_id,
                "count": count,
                "timestamp": datetime.datetime.now().isoformat()
            }
        )
        print(f"Данные для {audience_id} отправлены. Статус: {response.status_code}")
    except Exception as e:
        print(f"Ошибка отправки ({audience_id}): {e}")


def show_images(audience_data):
    """Отображает все изображения аудиторий с разметкой в уменьшенных окнах."""
    for i, (aud_id, (count, img)) in enumerate(audience_data.items()):
        if img is not None:
            # Изменяем размер изображения
            resized_img = cv2.resize(img, (WINDOW_WIDTH, WINDOW_HEIGHT))

            # Добавляем минималистичную надпись в угол
            cv2.putText(resized_img, f"{aud_id}: {count}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            # Создаём окно и перемещаем его
            cv2.namedWindow(aud_id, cv2.WINDOW_NORMAL)
            cv2.resizeWindow(aud_id, WINDOW_WIDTH, WINDOW_HEIGHT)
            cv2.moveWindow(aud_id, (i % 2) * WINDOW_WIDTH, (i // 2) * WINDOW_HEIGHT)
            cv2.imshow(aud_id, resized_img)

    cv2.waitKey(20000)  # Показываем изображения 5 секунд
    cv2.destroyAllWindows()  # Закрываем все окна


def check_schedule():
    """Проверяет, наступило ли время выполнения."""
    current_time = datetime.datetime.now().strftime("%H:%M")
    return current_time in SCHEDULED_TIMES


def process_audience(audience_id, image_path, audience_data):
    """Обрабатывает изображение для 'аудитории'."""
    if not os.path.exists(image_path):
        print(f"Изображение {image_path} не найдено!")
        return

    if check_schedule():
        people_count, annotated_img = count_people(image_path)
        print(f"[{datetime.datetime.now()}] {audience_id}: людей = {people_count}")
        send_to_backend(audience_id, people_count)
        audience_data[audience_id] = (people_count, annotated_img)


if __name__ == "__main__":
    AUDIENCES = {
        "РИ-502": os.path.join(TEST_IMAGES_DIR, "crowd1.jpg"),
        "РИ-333": os.path.join(TEST_IMAGES_DIR, "crowd2.jpg"),
    }

    os.makedirs(TEST_IMAGES_DIR, exist_ok=True)

    while True:
        audience_data = {}  # Словарь для хранения данных и изображений

        for aud_id, img_path in AUDIENCES.items():
            process_audience(aud_id, img_path, audience_data)

        if audience_data and check_schedule():
            show_images(audience_data)

        time.sleep(30)