import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function useReports(filters?: any) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const response = await api.get('/reports', { params: filters });
      return response.data;
    },
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: async () => {
      const response = await api.get(`/reports/saved/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/reports', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report saved successfully!');
    },
    onError: () => {
      toast.error('Failed to save report');
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/reports/saved/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/reports/saved/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete report');
    },
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async ({ type, params }: { type: string; params?: any }) => {
      const response = await api.get(`/reports/generate/${type}`, { params });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Report generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate report');
    },
  });
}
