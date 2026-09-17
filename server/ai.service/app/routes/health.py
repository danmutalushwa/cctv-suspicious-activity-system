from fastapi import APIRouter
import torch
from datetime import datetime
from app.config import config
from app.utils.logger import logger

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "AI Service",
        "version": "1.0.0",
        "gpu_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "device": "cuda" if config.USE_GPU and torch.cuda.is_available() else "cpu",
        "model_loaded": True
    }

@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    return {
        "ready": True,
        "timestamp": datetime.now().isoformat()
    }