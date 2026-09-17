from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from app.config import config
from app.utils.logger import logger
from app.routes import detection, health

# Create FastAPI app
app = FastAPI(
    title="CCTV Suspicious Activity Detection AI Service",
    description="AI service for detecting suspicious activities in CCTV footage",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response

# Include routers
app.include_router(detection.router, prefix="/api/v1", tags=["detection"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "CCTV Suspicious Activity Detection AI Service",
        "version": "1.0.0",
        "status": "running"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "timestamp": time.time()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG
    )