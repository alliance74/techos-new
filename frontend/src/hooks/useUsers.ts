import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update user');
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/users', data);
      return response.data.data as { user: any; employee?: any; temporary_password: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success('User invited successfully');
    },
    onError: (error: any) => {
      const raw = error?.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw;
      toast.error(message || 'Failed to invite user');
    },
  });
}

export function useUpdateMyProfile() {
  return useMutation({
    mutationFn: async (data: { first_name?: string; last_name?: string; avatar?: string }) => {
      const response = await api.put('/users/me/profile', data);
      return response.data.data;
    },
    onError: (error: any) => {
      const raw = error?.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw;
      toast.error(message || 'Failed to update profile');
    },
  });
}

export function useUpdateMyPassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/users/me/password', data);
      return response.data;
    },
    onError: (error: any) => {
      const raw = error?.response?.data?.message;
      const message = Array.isArray(raw) ? raw[0] : raw;
      toast.error(message || 'Failed to update password');
    },
  });
}
