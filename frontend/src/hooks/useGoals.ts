import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Goal, KeyResult, CreateGoalDto, UpdateGoalDto, CreateKeyResultDto, UpdateKeyResultDto } from '@/types/goal';

// Goals
export const useGoals = (type?: string) => {
  return useQuery({
    queryKey: ['goals', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const response = await api.get(`/goals${params}`);
      return response.data.data as Goal[];
    },
  });
};

export const useGoal = (id: string) => {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const response = await api.get(`/goals/${id}`);
      return response.data.data as Goal;
    },
    enabled: !!id,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateGoalDto) => {
      const response = await api.post('/goals', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created successfully');
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGoalDto }) => {
      const response = await api.put(`/goals/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal updated successfully');
    },
    onError: () => {
      toast.error('Failed to update goal');
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete goal');
    },
  });
};

// Key Results
export const useKeyResults = (goalId: string) => {
  return useQuery({
    queryKey: ['keyResults', goalId],
    queryFn: async () => {
      const response = await api.get(`/goals/${goalId}/key-results`);
      return response.data.data as KeyResult[];
    },
    enabled: !!goalId,
  });
};

export const useCreateKeyResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateKeyResultDto & { goal_id?: string; target?: number; current?: number; unit?: string }) => {
      const response = await api.post('/goals/key-results', {
        goal_id: data.goal_id || data.goalId,
        title: data.title,
        target: data.target ?? data.targetValue ?? 0,
        current: data.current ?? data.startValue ?? 0,
        unit: data.unit || '',
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyResults'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'goals'] });
      toast.success('Key result created successfully');
    },
    onError: () => {
      toast.error('Failed to create key result');
    },
  });
};

export const useUpdateKeyResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateKeyResultDto & { current?: number } }) => {
      const response = await api.put(`/goals/key-results/${id}`, {
        title: data.title,
        current: data.current ?? data.currentValue,
        unit: (data as any).unit,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyResults'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'goals'] });
      toast.success('Key result updated successfully');
    },
    onError: () => {
      toast.error('Failed to update key result');
    },
  });
};

export const useDeleteKeyResult = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/key-results/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyResults'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Key result deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete key result');
    },
  });
};
