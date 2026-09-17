import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../api/users';
import { notificationService } from '../services/notification.service';

export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersAPI.getAll(params),
    staleTime: 30000,
    keepPreviousData: true,
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => usersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notificationService.success('User created successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to create user');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      notificationService.success('User updated successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to update user');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notificationService.success('User deleted successfully');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to delete user');
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => usersAPI.toggleStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      notificationService.success('User status updated');
    },
    onError: (error) => {
      notificationService.error(error.userMessage || 'Failed to update status');
    },
  });
};