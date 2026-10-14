from fastapi import APIRouter, File, UploadFile, HTTPException

from app.services.detection_service import (
    detection_service
)

from app.services.tracking_service import (
    tracking_service
)

from app.services.activity_service import (
    activity_service
)

from app.utils.logger import logger
from app.utils.image_utils import decode_image


router = APIRouter()


# ============================================================
# OBJECT DETECTION
# ============================================================

@router.post("/detect")
async def detect_objects(
    file: UploadFile = File(...)
):

    try:

        image_data = await file.read()

        image = decode_image(
            image_data
        )

        if image is None:

            raise HTTPException(
                status_code=400,
                detail="Invalid image"
            )

        detections = (
            detection_service.detect(
                image
            )
        )

        logger.info(
            f"YOLO detected "
            f"{len(detections)} person(s)"
        )

        return {
            "success": True,
            "detections": detections,
            "count": len(detections)
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Detection error: {e}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# TRACKING
# ============================================================

@router.post("/track")
async def track_objects(
    file: UploadFile = File(...)
):

    try:

        image_data = await file.read()

        image = decode_image(
            image_data
        )

        if image is None:

            raise HTTPException(
                status_code=400,
                detail="Invalid image"
            )

        detections = (
            detection_service.detect(
                image
            )
        )

        tracked = (
            tracking_service.update(
                detections,
                image
            )
        )

        tracked_with_activities = []

        for track in tracked:

            activity = (
                activity_service.analyze_activity(
                    track
                )
            )

            tracked_with_activities.append({

                **track,

                'activity':
                    activity
            })

        return {

            "success": True,

            "detections":
                len(detections),

            "tracked_objects":
                tracked_with_activities,

            "count":
                len(tracked_with_activities)
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Tracking error: {e}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# SUSPICIOUS ACTIVITY
# ============================================================

@router.post("/detect-suspicious")
async def detect_suspicious_activity(
    file: UploadFile = File(...)
):

    try:

        image_data = await file.read()

        image = decode_image(
            image_data
        )

        if image is None:

            raise HTTPException(
                status_code=400,
                detail="Invalid image"
            )

        # ----------------------------------------------------
        # YOLO
        # ----------------------------------------------------

        detections = (
            detection_service.detect(
                image
            )
        )

        logger.info(
            f"Suspicious analysis: "
            f"YOLO found "
            f"{len(detections)} person(s)"
        )

        # ----------------------------------------------------
        # DeepSORT
        # ----------------------------------------------------

        tracked = (
            tracking_service.update(
                detections,
                image
            )
        )

        logger.info(
            f"Suspicious analysis: "
            f"DeepSORT returned "
            f"{len(tracked)} track(s)"
        )

        # ----------------------------------------------------
        # Activity analysis
        # ----------------------------------------------------

        suspicious_activities = []

        analyzed_tracks = []

        for track in tracked:

            activity = (
                activity_service.analyze_activity(
                    track
                )
            )

            analyzed_track = {

                **track,

                'activity':
                    activity
            }

            analyzed_tracks.append(
                analyzed_track
            )

            if activity.get(
                'is_suspicious',
                False
            ):

                detection = {

                    'track_id':
                        track.get(
                            'track_id'
                        ),

                    'bbox':
                        track.get(
                            'bbox'
                        ),

                    'activities':
                        activity.get(
                            'activities',
                            []
                        ),

                    'severity':
                        activity.get(
                            'severity',
                            'low'
                        ),

                    'zone':
                        activity.get(
                            'zone'
                        ),

                    'confidence':
                        track.get(
                            'confidence',
                            0
                        ),

                    'reason':
                        activity.get(
                            'reason',
                            'Suspicious activity detected'
                        )
                }

                suspicious_activities.append(
                    detection
                )

                logger.warning(
                    "SUSPICIOUS ACTIVITY: "
                    f"{activity.get('reason')}"
                )

        # ----------------------------------------------------
        # Overall severity
        # ----------------------------------------------------

        severity_levels = {

            'low': 0,

            'medium': 1,

            'high': 2,

            'critical': 3
        }

        if suspicious_activities:

            max_severity = max(
                severity_levels.get(
                    item.get(
                        'severity',
                        'low'
                    ),
                    0
                )
                for item
                in suspicious_activities
            )

        else:

            max_severity = 0

        overall_severity = next(
            (
                key
                for key, value
                in severity_levels.items()
                if value == max_severity
            ),
            'low'
        )

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        response = {

            "success": True,

            "detections":
                len(detections),

            "tracked":
                len(tracked),

            "suspicious_activities":
                suspicious_activities,

            "count":
                len(suspicious_activities),

            "overall_severity":
                overall_severity,

            "is_suspicious":
                len(suspicious_activities) > 0,

            "message":
                (
                    "Suspicious activity detected"
                    if suspicious_activities
                    else "No suspicious activity detected"
                )
        }

        logger.info(
            "AI result: "
            f"detections={len(detections)}, "
            f"tracks={len(tracked)}, "
            f"suspicious={len(suspicious_activities)}, "
            f"severity={overall_severity}"
        )

        return response

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Suspicious activity detection error: {e}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# MODEL INFORMATION
# ============================================================

@router.get("/model-info")
async def get_model_info():

    try:

        info = (
            detection_service.get_model_info()
        )

        return {

            "success": True,

            "info": info
        }

    except Exception as e:

        logger.error(
            f"Model info error: {e}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )