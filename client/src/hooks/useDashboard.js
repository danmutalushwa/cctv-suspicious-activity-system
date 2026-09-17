import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../api/dashboard';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardAPI.getStats(),
    refetchInterval: 60000, // Refresh every 60 seconds
    staleTime: 30000,
  });
};

export const useRealTimeData = () => {
  return useQuery({
    queryKey: ['dashboard', 'realtime'],
    queryFn: () => dashboardAPI.getRealTime(),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000,
  });
};

export const useSystemHealth = (enabled = false) => {
  return useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: () => dashboardAPI.getSystemHealth(),
    enabled,
    refetchInterval: 30000,
    staleTime: 20000,
  });
};

export const useActivityTimeline = (days = 7) => {
  return useQuery({
    queryKey: ['dashboard', 'timeline', days],
    queryFn: () => dashboardAPI.getTimeline(days),
    staleTime: 60000,
  });
};

export const useTopPerformers = (period = 'week') => {
  return useQuery({
    queryKey: ['dashboard', 'performers', period],
    queryFn: () => dashboardAPI.getTopPerformers(period),
    staleTime: 300000,
  });
};

export const useHeatmap = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'heatmap', days],
    queryFn: () => dashboardAPI.getHeatmap(days),
    staleTime: 300000,
  });
};