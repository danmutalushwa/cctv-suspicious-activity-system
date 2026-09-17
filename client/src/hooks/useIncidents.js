import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsAPI } from '../api/incidents';
import { notificationService } from '../services/notification.service';

export const useIncidents = (params = {}) => {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => incidentsAPI.getAll(params),
    staleTime: 30000,
    keepPreviousData: true,
  });
};

export const useIncident = (id) => {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => incidentsAPI.getById(id),
    enabled: !!id,
  });
};

export const useIncidentStatistics = () => {
  return useQuery({
    queryKey: ['incidents', 'statistics'],
    queryFn: () => incidentsAPI.getStatistics(),
    staleTime: 60000,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => incidentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notificationService.success('Incident created successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to create incident');
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => incidentsAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.id] });
      notificationService.success('Incident updated successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to update incident');
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => incidentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      notificationService.success('Incident deleted successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to delete incident');
    },
  });
};

export const useAssignIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }) => incidentsAPI.assign(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.id] });
      notificationService.success('Incident assigned successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to assign incident');
    },
  });
};

export const useResolveIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => incidentsAPI.resolve(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.id] });
      notificationService.success('Incident resolved successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to resolve incident');
    },
  });
};

export const useAddIncidentNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => incidentsAPI.addNote(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.id] });
      notificationService.success('Note added successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to add note');
    },
  });
};

export const useUploadEvidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, files, type }) => incidentsAPI.uploadEvidence(id, files, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', variables.id] });
      notificationService.success('Evidence uploaded successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to upload evidence');
    },
  });
};