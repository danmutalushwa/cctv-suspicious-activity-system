import numpy as np
from deep_sort_realtime.deepsort_tracker import DeepSort
from typing import List, Dict, Any

from app.config import config
from app.utils.logger import logger


class TrackingService:
    """Service for object tracking using DeepSORT."""

    def __init__(self):

        self.tracker = None

        self.tracked_objects = {}

        self.frame_count = 0

        self.init_tracker()

    def init_tracker(self):

        try:

            self.tracker = DeepSort(
                max_age=config.MAX_AGE,
                max_iou_distance=config.MAX_DISTANCE,
                n_init=config.MIN_HITS,
                nn_budget=100,
                embedder='mobilenet',
                half=True,
                bgr=True
            )

            logger.info(
                "DeepSORT tracker initialized"
            )

        except Exception as e:

            logger.error(
                f"Failed to initialize tracker: {e}"
            )

            raise

    def update(
        self,
        detections: List[Dict[str, Any]],
        frame: np.ndarray
    ) -> List[Dict[str, Any]]:

        if self.tracker is None:
            return []

        try:

            self.frame_count += 1

            deepsort_detections = []

            for det in detections:

                bbox = det['bbox']

                confidence = det['confidence']

                width = (
                    bbox[2] - bbox[0]
                )

                height = (
                    bbox[3] - bbox[1]
                )

                deepsort_detections.append(
                    [
                        [
                            bbox[0],
                            bbox[1],
                            width,
                            height
                        ],
                        confidence,
                        det['class_id']
                    ]
                )

            tracked_objects = (
                self.tracker.update_tracks(
                    deepsort_detections,
                    frame=frame
                )
            )

            results = []

            for track in tracked_objects:

                # For this project we allow a track
                # to be used as soon as DeepSORT
                # provides a track id.
                if track.track_id is None:
                    continue

                track_id = track.track_id

                ltrb = track.to_ltrb()

                centroid = track.get_center()

                if centroid is None:
                    continue

                # ------------------------------------------------
                # Initialize history
                # ------------------------------------------------

                if (
                    track_id
                    not in self.tracked_objects
                ):

                    self.tracked_objects[
                        track_id
                    ] = {
                        'first_seen':
                            self.frame_count,

                        'positions': [],

                        'timestamps': []
                    }

                history = (
                    self.tracked_objects[
                        track_id
                    ]
                )

                # ------------------------------------------------
                # Store position
                # ------------------------------------------------

                history[
                    'positions'
                ].append(
                    [
                        float(centroid[0]),
                        float(centroid[1])
                    ]
                )

                history[
                    'timestamps'
                ].append(
                    self.frame_count
                )

                # Keep memory manageable.
                history[
                    'positions'
                ] = history[
                    'positions'
                ][-60:]

                history[
                    'timestamps'
                ] = history[
                    'timestamps'
                ][-60:]

                # ------------------------------------------------
                # Loitering
                # ------------------------------------------------

                is_loitering = (
                    self.check_loitering(
                        track_id
                    )
                )

                confidence = (
                    track.get_conf()
                    or 0
                )

                result = {

                    'track_id':
                        track_id,

                    'bbox': [
                        int(x)
                        for x in ltrb
                    ],

                    'centroid': [
                        int(x)
                        for x in centroid
                    ],

                    'confidence':
                        float(confidence),

                    'class_id':
                        track.get_class(),

                    'is_loitering':
                        is_loitering,

                    'time_visible':
                        (
                            self.frame_count
                            - history[
                                'first_seen'
                            ]
                            + 1
                        ),

                    'positions':
                        history[
                            'positions'
                        ][-30:]
                }

                results.append(result)

            logger.info(
                f"Tracking: {len(detections)} "
                f"detection(s) -> "
                f"{len(results)} track(s)"
            )

            return results

        except Exception as e:

            logger.error(
                f"Tracking error: {e}"
            )

            return []

    def check_loitering(
        self,
        track_id: int
    ) -> bool:

        if (
            track_id
            not in self.tracked_objects
        ):
            return False

        positions = (
            self.tracked_objects[
                track_id
            ]['positions']
        )

        required_frames = (
            config.LOITERING_TIME
        )

        if len(positions) < required_frames:
            return False

        recent_positions = positions[
            -required_frames:
        ]

        if len(recent_positions) < 2:
            return False

        movements = []

        for i in range(
            1,
            len(recent_positions)
        ):

            dx = (
                recent_positions[i][0]
                - recent_positions[i - 1][0]
            )

            dy = (
                recent_positions[i][1]
                - recent_positions[i - 1][1]
            )

            movement = np.sqrt(
                dx ** 2 + dy ** 2
            )

            movements.append(
                movement
            )

        avg_movement = (
            np.mean(movements)
            if movements
            else 0
        )

        return avg_movement < 10

    def clear_old_tracks(
        self,
        max_age: int = 60
    ):

        to_delete = []

        for (
            track_id,
            data
        ) in self.tracked_objects.items():

            age = (
                self.frame_count
                - data['first_seen']
            )

            if age > max_age:

                to_delete.append(
                    track_id
                )

        for track_id in to_delete:

            del self.tracked_objects[
                track_id
            ]


tracking_service = TrackingService()