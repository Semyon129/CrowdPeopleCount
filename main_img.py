from datetime import datetime
import requests
from ultralytics import YOLO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = YOLO('best.pt')

def count_people_in_image(image_path, room_id):
    try:
        # Детекция объектов
        results = model(image_path)
        
        # Отладочный вывод
        for result in results:
            logger.info(f"Все классы: {result.boxes.cls.tolist()}")
            logger.info(f"Имена классов: {result.names}")
        
        # Подсчёт объектов класса 1 (human headumrah)
        person_count = sum(1 for result in results 
                         for box in result.boxes 
                         if int(box.cls) == 1)  # Используем числовой ID класса
        
        logger.info(f"Найдено {person_count} людей в {image_path}")

        # Подготовка данных для отправки
        detection_data = {
            "room_id": room_id,
            "count": person_count,
            "timestamp": datetime.now().isoformat()
        }
        
        # Логируем данные перед отправкой
        logger.info(f"Отправляемые данные: {detection_data}")
        
        # Отправка данных с таймаутом и обработкой ошибок
        try:
            response = requests.post(
                "http://localhost:8000/detections/",
                json=detection_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Данные успешно отправлены: {response.json()}")
            else:
                logger.error(f"Ошибка сервера {response.status_code}: {response.text}")
                # Дополнительная диагностика при 502 ошибке
                if response.status_code == 502:
                    test_server_connection()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка соединения: {str(e)}")
            test_server_connection()
            
    except Exception as e:
        logger.error(f"Критическая ошибка: {str(e)}", exc_info=True)

def test_server_connection():
    """Тестирование доступности сервера"""
    try:
        logger.info("Проверка доступности сервера...")
        health_check = requests.get("http://localhost:8000/", timeout=5)
        logger.info(f"Сервер доступен. Статус: {health_check.status_code}")
        
        # Проверка конкретного эндпоинта
        detections_check = requests.get("http://localhost:8000/detections/", timeout=5)
        logger.info(f"Проверка /detections/: {detections_check.status_code}")
        
    except Exception as e:
        logger.error(f"Сервер недоступен: {str(e)}")

if __name__ == "__main__":
    # Проверка доступности сервера перед началом работы
    test_server_connection()
    
    # Обработка изображений
    count_people_in_image("test_images/crowd1.jpg", "RI-502")
    count_people_in_image("test_images/crowd2.jpg", "RI-333")