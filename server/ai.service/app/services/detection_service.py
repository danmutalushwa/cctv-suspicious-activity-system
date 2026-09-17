import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
import torch
from typing import List, Dict, Any, Optional
from app.config import config
from app.utils.logger import logger

class DetectionService:
    """Service for object detection using YOLO"""
    
    def __init__(self):
        self.model = None
        self.class_names = None
        self.device = 'cuda' if config.USE_GPU and torch.cuda.is_available() else 'cpu'
        self.load_model()
        
    def load_model(self):
        """Load YOLO model"""
        try:
            model_path = Path(config.MODEL_DIR) / config.YOLO_MODEL
            if not model_path.exists():
                logger.warning(f"Model not found at {model_path}, downloading...")
                self.model = YOLO(config.YOLO_MODEL)
            else:
                self.model = YOLO(str(model_path))
            
            # Move to GPU if available
            if self.device == 'cuda':
                self.model.to('cuda')
            
            self.class_names = self.model.names
            logger.info(f"Model loaded on {self.device}: {config.YOLO_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def detect(self, image: np.ndarray, conf_threshold: float = None) -> List[Dict[str, Any]]:
        """
        Detect objects in image
        
        Args:
            image: Input image (numpy array)
            conf_threshold: Confidence threshold (default: config.CONFIDENCE_THRESHOLD)
        
        Returns:
            List of detections with bounding boxes, class, and confidence
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        conf_threshold = conf_threshold or config.CONFIDENCE_THRESHOLD
        
        try:
            # Run inference
            results = self.model(
                image, 
                conf=conf_threshold,
                iou=config.IOU_THRESHOLD,
                max_det=config.MAX_DETECTIONS,
                verbose=False
            )
            
            detections = []
            
            if results and len(results) > 0:
                result = results[0]
                
                if result.boxes is not None:
                    boxes = result.boxes
                    
                    for box in boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        # Get confidence and class
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.class_names[class_id]
                        
                        # Only detect people (class 0)
                        # You can modify this to detect other objects
                        if class_id == 0:  # person
                            detection = {
                                'bbox': [int(x1), int(y1), int(x2), int(y2)],
                                'confidence': confidence,
                                'class_id': class_id,
                                'class_name': class_name,
                                'width': int(x2 - x1),
                                'height': int(y2 - y1),
                                'center': [
                                    int((x1 + x2) / 2),
                                    int((y1 + y2) / 2)
                                ]
                            }
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Detection error: {e}")
            return []

    def detect_batch(self, images: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        """Detect objects in batch of images"""
        results = []
        for image in images:
            detections = self.detect(image)
            results.append(detections)
        return results

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'model': config.YOLO_MODEL,
            'device': self.device,
            'classes': list(self.class_names.values()),
            'num_classes': len(self.class_names)
        }

# Singleton instance
detection_service = DetectionService()