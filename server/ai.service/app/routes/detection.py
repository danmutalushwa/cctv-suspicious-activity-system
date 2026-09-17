from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from typing import List, Dict, Any
from app.services.detection_service import detection_service
from app.services.tracking_service import tracking_service
from app.services.activity_service import activity_service
from app.utils.logger import logger
from app.utils.image_utils import decode_image, process_frame

router = APIRouter()

@router.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """Detect objects in uploaded image"""
    try:
        # Read and decode image
        image_data = await file.read()
        image = decode_image(image_data)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Run detection
        detections = detection_service.detect(image)
        
        return {
            "success": True,
            "detections": detections,
            "count": len(detections)
        }
    
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track")
async def track_objects(file: UploadFile = File(...)):
    """Track objects in uploaded video frame"""
    try:
        # Read and decode image
        image_data = await file.read()
        image = decode_image(image_data)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Run detection and tracking
        detections = detection_service.detect(image)
        tracked = tracking_service.update(detections, image)
        
        # Analyze activities
        tracked_with_activities = []
        for track in tracked:
            activity = activity_service.analyze_activity(track)
            tracked_with_activities.append({
                **track,
                'activity': activity
            })
        
        return {
            "success": True,
            "tracked_objects": tracked_with_activities,
            "count": len(tracked_with_activities)
        }
    
    except Exception as e:
        logger.error(f"Tracking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-suspicious")
async def detect_suspicious_activity(file: UploadFile = File(...)):
    """Detect suspicious activity in uploaded image"""
    try:
        # Read and decode image
        image_data = await file.read()
        image = decode_image(image_data)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Run detection and tracking
        detections = detection_service.detect(image)
        tracked = tracking_service.update(detections, image)
        
        # Analyze each track for suspicious activity
        suspicious_activities = []
        for track in tracked:
            activity = activity_service.analyze_activity(track)
            if activity.get('is_suspicious', False):
                suspicious_activities.append({
                    'track_id': track.get('track_id'),
                    'bbox': track.get('bbox'),
                    'activities': activity.get('activities', []),
                    'severity': activity.get('severity', 'low'),
                    'zone': activity.get('zone'),
                    'confidence': track.get('confidence', 0)
                })
        
        # Determine overall severity
        severity_levels = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
        max_severity = max(
            [severity_levels.get(s.get('severity', 'low'), 0) for s in suspicious_activities],
            default=0
        )
        overall_severity = [k for k, v in severity_levels.items() if v == max_severity][0]
        
        return {
            "success": True,
            "suspicious_activities": suspicious_activities,
            "count": len(suspicious_activities),
            "overall_severity": overall_severity,
            "is_suspicious": len(suspicious_activities) > 0
        }
    
    except Exception as e:
        logger.error(f"Suspicious activity detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    try:
        info = detection_service.get_model_info()
        return {
            "success": True,
            "info": info
        }
    except Exception as e:
        logger.error(f"Model info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))