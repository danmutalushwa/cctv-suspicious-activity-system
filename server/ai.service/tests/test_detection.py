import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gpu_available" in data

def test_model_info():
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "info" in data

def test_detection_with_sample_image():
    # Create a sample image (black canvas)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Add a simple shape to detect
    cv2.rectangle(img, (100, 100), (200, 200), (255, 255, 255), -1)
    
    # Save to buffer
    _, img_encoded = cv2.imencode('.jpg', img)
    
    # Test detection
    files = {'file': ('test.jpg', img_encoded.tobytes(), 'image/jpeg')}
    response = client.post("/api/v1/detect", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    # Even if no detection, should return empty list
    assert "detections" in data

def test_suspicious_activity_detection():
    # Create a sample image
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img, (100, 100), (200, 200), (255, 255, 255), -1)
    
    _, img_encoded = cv2.imencode('.jpg', img)
    
    files = {'file': ('test.jpg', img_encoded.tobytes(), 'image/jpeg')}
    response = client.post("/api/v1/detect-suspicious", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "suspicious_activities" in data
    assert "is_suspicious" in data