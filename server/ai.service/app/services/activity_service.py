import numpy as np
from typing import List, Dict, Any, Optional
from app.config import config
from app.utils.logger import logger

class ActivityService:
    """Service for activity recognition and suspicious behavior detection"""
    
    def __init__(self):
        self.suspicious_behaviors = {}
        self.intrusion_zones = []
        self.initialize_zones()
        logger.info("Activity service initialized")

    def initialize_zones(self):
        """Initialize intrusion zones"""
        # This would typically be loaded from a database or config file
        self.intrusion_zones = [
            {
                'id': 'zone_1',
                'name': 'Restricted Area 1',
                'polygon': [(100, 100), (400, 100), (400, 400), (100, 400)],
                'level': 'high'
            }
        ]

    def detect_intrusion(self, track: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect if a tracked person enters a restricted zone
        
        Args:
            track: Tracked object data
        
        Returns:
            Intrusion detection result
        """
        centroid = track.get('centroid')
        if not centroid:
            return {'intrusion': False}
        
        for zone in self.intrusion_zones:
            if self.point_in_polygon(centroid, zone['polygon']):
                return {
                    'intrusion': True,
                    'zone': zone['name'],
                    'zone_id': zone['id'],
                    'severity': zone['level']
                }
        
        return {'intrusion': False}

    def point_in_polygon(self, point: List[int], polygon: List[tuple]) -> bool:
        """Check if point is inside polygon using ray casting algorithm"""
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside

    def detect_trespassing(self, track: Dict[str, Any], previous_track: Optional[Dict[str, Any]] = None) -> bool:
        """
        Detect trespassing based on movement patterns
        
        Args:
            track: Current track data
            previous_track: Previous track data for comparison
        
        Returns:
            True if trespassing detected, False otherwise
        """
        if not previous_track:
            return False
        
        # Check if person moved significantly closer to restricted area
        # This is a simplified implementation
        
        current_pos = track.get('centroid')
        previous_pos = previous_track.get('centroid')
        
        if not current_pos or not previous_pos:
            return False
        
        # Calculate distance moved
        dx = current_pos[0] - previous_pos[0]
        dy = current_pos[1] - previous_pos[1]
        distance = np.sqrt(dx**2 + dy**2)
        
        # Check if moved towards a restricted zone
        for zone in self.intrusion_zones:
            if self.is_moving_towards_zone(previous_pos, current_pos, zone['polygon']):
                return True
        
        return False

    def is_moving_towards_zone(self, from_pos: List[int], to_pos: List[int], polygon: List[tuple]) -> bool:
        """Check if movement is towards a restricted zone"""
        # Simplified: Check if distance to zone center decreased
        center_x = sum(p[0] for p in polygon) / len(polygon)
        center_y = sum(p[1] for p in polygon) / len(polygon)
        
        from_dist = np.sqrt((from_pos[0] - center_x)**2 + (from_pos[1] - center_y)**2)
        to_dist = np.sqrt((to_pos[0] - center_x)**2 + (to_pos[1] - center_y)**2)
        
        return to_dist < from_dist

    def analyze_activity(self, track: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze activity of a tracked object
        
        Args:
            track: Track data
        
        Returns:
            Activity analysis result
        """
        analysis = {
            'track_id': track.get('track_id'),
            'is_suspicious': False,
            'activities': [],
            'severity': 'low'
        }
        
        # Check for loitering
        if track.get('is_loitering', False):
            analysis['activities'].append('loitering')
            analysis['is_suspicious'] = True
            analysis['severity'] = 'medium'
        
        # Check for intrusion
        intrusion = self.detect_intrusion(track)
        if intrusion.get('intrusion'):
            analysis['activities'].append('intrusion')
            analysis['is_suspicious'] = True
            analysis['severity'] = 'high'
            analysis['zone'] = intrusion.get('zone')
        
        # Check for rapid movement (potential theft/aggression)
        if self.detect_rapid_movement(track):
            analysis['activities'].append('rapid_movement')
            analysis['is_suspicious'] = True
            analysis['severity'] = 'high'
        
        # Check for unusual behavior (e.g., facing wall, hiding)
        if self.detect_unusual_behavior(track):
            analysis['activities'].append('unusual_behavior')
            analysis['is_suspicious'] = True
        
        return analysis

    def detect_rapid_movement(self, track: Dict[str, Any], threshold: float = 50.0) -> bool:
        """Detect rapid movement (potential theft or aggression)"""
        positions = track.get('positions', [])
        if len(positions) < 5:
            return False
        
        # Calculate speed
        recent_positions = positions[-5:]
        speeds = []
        for i in range(1, len(recent_positions)):
            dx = recent_positions[i][0] - recent_positions[i-1][0]
            dy = recent_positions[i][1] - recent_positions[i-1][1]
            speed = np.sqrt(dx**2 + dy**2)
            speeds.append(speed)
        
        avg_speed = np.mean(speeds) if speeds else 0
        return avg_speed > threshold

    def detect_unusual_behavior(self, track: Dict[str, Any]) -> bool:
        """Detect unusual behavior patterns"""
        # This would use more sophisticated AI models
        # For now, we'll use simple heuristics
        time_visible = track.get('time_visible', 0)
        
        # If person has been visible for a long time without moving much
        if time_visible > 60 and not track.get('is_loitering', False):
            return True
        
        return False

# Singleton instance
activity_service = ActivityService()