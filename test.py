import requests

res = requests.post(
    "http://127.0.0.1:8001/detections/",
    json={
        "room_id": "PM-502",
        "count": 5,
        "timestamp": "2024-06-01T12:00:00"
    },
    headers={"Content-Type": "application/json"} 
)

print(res.status_code)
print(res.text)
print(res.request.headers)
print(res.request.body)
