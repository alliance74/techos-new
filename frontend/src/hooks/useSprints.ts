import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Sprint, SprintStats } from '@/types/sprint';
import toast from 'react-hot-toast';

export function useSprints(projectId?: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const url = projectId ? `/sprints?project_id=${projectId}` : '/sprints';
      const response = await api.get(url);
      return response.data.data as Sprint[];
    },
  });
}

export function useSprint(id: string) {
  return useQuery({
    queryKey: ['sprints', id],
    queryFn: async () => {
      const response = await api.get(`/sprints/${id}`);
      return response.data.data as Sprint;
    },
    enabled: !!id,
  });
}

export function useSprintStats(id: string) {
  return useQuery({
    queryKey: ['sprints', id, 'stats'],
    queryFn: async () => {
      const response = await api.get(`/sprints/${id}/stats`);
      return response.data.data as SprintStats;
    },
    enabled: !!id,
  });
}

export function useActiveSprint(projectId: string) {
  return useQuery({
    queryKey: ['sprints', 'active', projectId],
    queryFn: async () => {
      const response = await api.get(`/sprints/active/${projectId}`);
      return response.data.data as Sprint;
    },
    enabled: !!projectId,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Sprint>) => {
      const response = await api.post('/sprints', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create sprint');
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Sprint> }) => {
      const response = await api.put(`/sprints/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update sprint');
    },
  });
}

export function useStartSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/sprints/${id}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'sprints'] });
      toast.success('Sprint started!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start sprint');
    },
  });
}

export function useCompleteSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/sprints/${id}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'sprints'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'tasks'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete sprint');
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/sprints/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete sprint');
    },
  });
}

export function useAddTaskToSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      const response = await api.post(`/sprints/${sprintId}/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'sprints'] });
      toast.success('Task added to sprint!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add task to sprint');
    },
  });
}

export function useRemoveTaskFromSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      const response = await api.delete(`/sprints/${sprintId}/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'sprints'] });
      toast.success('Task removed from sprint!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove task from sprint');
    },
  });
}
