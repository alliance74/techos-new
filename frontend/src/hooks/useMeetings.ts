import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Meeting, ActionItem } from '@/types/meeting';
import toast from 'react-hot-toast';

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const response = await api.get('/meetings');
      return response.data.data as Meeting[];
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meetings', id],
    queryFn: async () => {
      const response = await api.get(`/meetings/${id}`);
      return response.data.data as Meeting;
    },
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const response = await api.post('/meetings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Meeting> }) => {
      const response = await api.put(`/meetings/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update meeting');
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/meetings/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete meeting');
    },
  });
}

export function useActionItems(meetingId: string) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'action-items'],
    queryFn: async () => {
      const response = await api.get(`/meetings/${meetingId}/action-items`);
      return response.data.data as ActionItem[];
    },
    enabled: !!meetingId,
  });
}

export function useCreateActionItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ meetingId, data }: { meetingId: string; data: Partial<ActionItem> }) => {
      const response = await api.post(`/meetings/${meetingId}/action-items`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId, 'action-items'] });
      toast.success('Action item created!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create action item');
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ActionItem> }) => {
      const response = await api.put(`/meetings/action-items/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Action item updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update action item');
    },
  });
}
