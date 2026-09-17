import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';
import { notificationService } from '../services/notification.service';

export const useReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsAPI.getAll(params),
    staleTime: 30000,
    keepPreviousData: true,
    refetchInterval: (data) => {
      // Auto-refresh while reports are generating
      const reports = data?.data?.reports || [];
      const hasGenerating = reports.some(
        (r) => r.status === 'generating' || r.status === 'pending'
      );
      return hasGenerating ? 5000 : false;
    },
  });
};

export const useReport = (id) => {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsAPI.getById(id),
    enabled: !!id,
    refetchInterval: (data) => {
      const status = data?.data?.report?.status;
      return status === 'generating' || status === 'pending' ? 5000 : false;
    },
  });
};

export const useReportStatistics = () => {
  return useQuery({
    queryKey: ['reports', 'statistics'],
    queryFn: () => reportsAPI.getStatistics(),
    staleTime: 60000,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => reportsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      notificationService.success(
        'Report generation started. You will be notified when completed.'
      );
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to create report');
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => reportsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'statistics'] });
      notificationService.success('Report deleted successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to delete report');
    },
  });
};

export const useScheduleReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => reportsAPI.schedule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', variables.id] });
      notificationService.success('Report scheduled successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to schedule report');
    },
  });
};