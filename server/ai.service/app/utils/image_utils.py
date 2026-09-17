import cv2
import numpy as np


def decode_image(image_data: bytes):
    """
    Decode raw image bytes into an OpenCV BGR image.
    """
    try:
        np_array = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None


def process_frame(frame):
    """
    Basic frame preprocessing.
    Ensures the frame is a valid OpenCV image.
    """
    if frame is None:
        return None

    if not isinstance(frame, np.ndarray):
        return None

    return frame