# AI Service for CCTV Suspicious Activity Detection

## Overview

This service provides AI-powered detection and tracking for suspicious activities in CCTV footage.

## Features

- Object detection using YOLOv8
- Object tracking using DeepSORT
- Activity recognition
- Suspicious behavior detection:
  - Loitering detection
  - Intrusion detection (restricted zones)
  - Trespassing detection
  - Rapid movement detection
  - Unusual behavior detection

## Installation

### Prerequisites

- Python 3.10+
- CUDA (optional, for GPU acceleration)

### Setup

```bash
# Clone the repository
cd ai-service

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Download pre-trained model
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```
