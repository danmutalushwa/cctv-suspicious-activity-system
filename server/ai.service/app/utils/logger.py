import logging
import sys
from pathlib import Path
from datetime import datetime
from pythonjsonlogger import jsonlogger

def setup_logger(name, log_dir='./logs'):
    """Setup logger with file and console handlers"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if config.DEBUG else logging.INFO)
    
    # Create log directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG if config.DEBUG else logging.INFO)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)
    
    # File handler with JSON format
    log_file = log_path / f'{name}_{datetime.now().strftime("%Y%m%d")}.log'
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    
    json_formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    file_handler.setFormatter(json_formatter)
    logger.addHandler(file_handler)
    
    return logger

# Import config here to avoid circular import
from app.config import config

logger = setup_logger('ai_service', config.LOG_DIR)