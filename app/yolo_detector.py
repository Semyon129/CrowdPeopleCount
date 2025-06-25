from ultralytics import YOLO
from PIL import Image

model = YOLO("best.pt")

def count_people(image_path: str) -> int:
    results = model(image_path)
    people_count = 0
    for result in results:
        people_count += len(result.boxes.cls)
    return people_count
