import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../api/alerts';
import { notificationService } from '../services/notification.service';

export const useAlerts = (params = {}) => {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsAPI.getAll(params),
    staleTime: 15000,
    keepPreviousData: true,
  });
};

export const useAlert = (id) => {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: () => alertsAPI.getById(id),
    enabled: !!id,
  });
};

export const useAlertStatistics = () => {
  return useQuery({
    queryKey: ['alerts', 'statistics'],
    queryFn: () => alertsAPI.getStatistics(),
    staleTime: 30000,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => alertsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      notificationService.success('Alert created successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to create alert');
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => alertsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      notificationService.success('Alert deleted successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to delete alert');
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => alertsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => alertsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      notificationService.success('All alerts marked as read');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to mark alerts');
    },
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => alertsAPI.acknowledge(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', id] });
      notificationService.success('Alert acknowledged');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to acknowledge alert');
    },
  });
};