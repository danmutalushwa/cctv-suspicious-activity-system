import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Server
    HOST = os.getenv('AI_HOST', '0.0.0.0')
    PORT = int(os.getenv('AI_PORT', 5001))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Model paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    MODEL_DIR = os.getenv('MODEL_DIR', BASE_DIR)
    YOLO_MODEL = os.getenv('YOLO_MODEL', 'yolov8n.pt')
    ACTIVITY_MODEL = os.getenv('ACTIVITY_MODEL', 'activity_model.pth')
    
    # Detection settings
    CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.5))
    IOU_THRESHOLD = float(os.getenv('IOU_THRESHOLD', 0.45))
    MAX_DETECTIONS = int(os.getenv('MAX_DETECTIONS', 100))
    
    # Tracking settings
    MAX_AGE = int(os.getenv('MAX_AGE', 30))
    MIN_HITS = int(os.getenv('MIN_HITS', 3))
    MAX_DISTANCE = float(os.getenv('MAX_DISTANCE', 50.0))
    
    # Activity settings
    LOITERING_TIME = int(os.getenv('LOITERING_TIME', 30))  # seconds
    INTRUSION_DISTANCE = int(os.getenv('INTRUSION_DISTANCE', 50))  # pixels
    
    # Storage
    UPLOAD_DIR = os.getenv('UPLOAD_DIR', './uploads')
    LOG_DIR = os.getenv('LOG_DIR', './logs')
    
    # Security
    API_KEY = os.getenv('API_KEY', 'your-secret-api-key-here')
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    
    # Performance
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 8))
    NUM_WORKERS = int(os.getenv('NUM_WORKERS', 4))
    USE_GPU = os.getenv('USE_GPU', 'True').lower() == 'true'

config = Config()