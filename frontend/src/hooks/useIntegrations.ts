import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Integration, CreateIntegrationDto, UpdateIntegrationDto } from '@/types/integration';

export const useIntegrations = () => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await api.get('/integrations');
      return response.data.data as Integration[];
    },
  });
};

export const useIntegration = (id: string) => {
  return useQuery({
    queryKey: ['integration', id],
    queryFn: async () => {
      const response = await api.get(`/integrations/${id}`);
      return response.data.data as Integration;
    },
    enabled: !!id,
  });
};

export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateIntegrationDto) => {
      const response = await api.post('/integrations', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration created successfully');
    },
    onError: () => {
      toast.error('Failed to create integration');
    },
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIntegrationDto }) => {
      const response = await api.put(`/integrations/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration updated successfully');
    },
    onError: () => {
      toast.error('Failed to update integration');
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/integrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete integration');
    },
  });
};

export const useConnectIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/integrations/${id}/connect`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration connected successfully');
    },
    onError: () => {
      toast.error('Failed to connect integration');
    },
  });
};

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/integrations/${id}/disconnect`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration disconnected');
    },
    onError: () => {
      toast.error('Failed to disconnect integration');
    },
  });
};
