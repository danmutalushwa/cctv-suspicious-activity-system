import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { camerasAPI } from '../api/cameras';
import { socketService } from '../services/socket';

/**
 * Fetch cameras with polling for real-time status
 */
export const useLiveCameras = (params = {}) => {
  return useQuery({
    queryKey: ['cameras', 'live', params],
    queryFn: () => camerasAPI.getAll({ ...params, limit: 100 }),
    refetchInterval: 15000,
    staleTime: 10000,
  });
};

/**
 * Subscribe to live socket events
 */
export const useLiveEvents = () => {
  const [events, setEvents] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  const addEvent = useCallback((event) => {
    setEvents((prev) => [event, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleAlert = (data) => {
      addEvent({ type: 'alert', ...data, timestamp: new Date().toISOString() });
      setAlertCount((c) => c + 1);
    };

    const handleIncident = (data) => {
      addEvent({ type: 'incident', ...data, timestamp: new Date().toISOString() });
    };

    const handleStreamStart = (data) => {
      addEvent({ type: 'stream_started', ...data, timestamp: new Date().toISOString() });
    };

    socket.on('new_alert', handleAlert);
    socket.on('incident_created', handleIncident);
    socket.on('camera_stream_started', handleStreamStart);

    return () => {
      socket.off('new_alert', handleAlert);
      socket.off('incident_created', handleIncident);
      socket.off('camera_stream_started', handleStreamStart);
    };
  }, [addEvent]);

  const clearEvents = () => {
    setEvents([]);
    setAlertCount(0);
  };

  return { events, alertCount, clearEvents };
};

/**
 * Fullscreen toggle hook
 */
export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = (element) => {
    const el = element || document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return { isFullscreen, toggleFullscreen };
};