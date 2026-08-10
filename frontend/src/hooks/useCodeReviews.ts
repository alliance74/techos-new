import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface CodeReview {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  priority: 'low' | 'medium' | 'high' | 'critical';
  author_id: string;
  author_name?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  pull_request_url?: string;
  repository?: string;
  branch?: string;
  files_changed?: number;
  lines_added?: number;
  lines_removed?: number;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
}

export function useCodeReviews() {
  return useQuery({
    queryKey: ['code-reviews'],
    queryFn: async () => {
      const response = await api.get('/code-reviews');
      return response.data.data as CodeReview[];
    },
  });
}

export function useCodeReview(id: string) {
  return useQuery({
    queryKey: ['code-reviews', id],
    queryFn: async () => {
      const response = await api.get(`/code-reviews/${id}`);
      return response.data.data as CodeReview;
    },
    enabled: !!id,
  });
}

export function useCreateCodeReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<CodeReview>) => {
      const response = await api.post('/code-reviews', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-reviews'] });
      toast.success('Code review created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create code review');
    },
  });
}

export function useUpdateCodeReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CodeReview> }) => {
      const response = await api.put(`/code-reviews/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-reviews'] });
      toast.success('Code review updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update code review');
    },
  });
}

export function useApproveCodeReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/code-reviews/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-reviews'] });
      toast.success('Code review approved!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve code review');
    },
  });
}

export function useRejectCodeReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await api.post(`/code-reviews/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-reviews'] });
      toast.success('Code review rejected!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject code review');
    },
  });
}

export function useRequestChanges() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      const response = await api.post(`/code-reviews/${id}/request-changes`, { comments });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-reviews'] });
      toast.success('Changes requested!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request changes');
    },
  });
}
