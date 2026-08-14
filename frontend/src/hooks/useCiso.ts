import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface CisoTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id?: string;
  assignee_id?: string;
  finished: boolean;
}

export interface CisoAuditProject {
  id: string;
  name: string;
  status: string;
  priority: string;
  audit_required: boolean;
  audit_status: 'needed' | 'in_progress' | 'completed';
}

export interface CisoReport {
  id: string;
  title: string;
  type: string;
  created_at: string;
  data?: { summary?: string };
}

export function useCisoTasks(status?: 'finished' | 'not_finished') {
  return useQuery({
    queryKey: ['ciso', 'tasks', status],
    queryFn: async () => {
      const response = await api.get('/ciso/tasks', { params: status ? { status } : undefined });
      return response.data.data as CisoTask[];
    },
  });
}

export function useUpdateCisoTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, finished }: { id: string; finished: boolean }) => {
      const response = await api.patch(`/ciso/tasks/${id}/status`, { finished });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'tasks'] });
      toast.success('Task status updated');
    },
    onError: () => toast.error('Failed to update task status'),
  });
}

export function useCisoAuditProjects(status?: 'needed' | 'in_progress' | 'completed') {
  return useQuery({
    queryKey: ['ciso', 'audit-projects', status],
    queryFn: async () => {
      const response = await api.get('/ciso/projects/audits', { params: status ? { status } : undefined });
      return response.data.data as CisoAuditProject[];
    },
  });
}

export function useUpdateAuditProjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      audit_status,
    }: {
      id: string;
      audit_status: 'needed' | 'in_progress' | 'completed';
    }) => {
      const response = await api.patch(`/ciso/projects/${id}/audit-status`, { audit_status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-projects'] });
      toast.success('Audit status updated');
    },
    onError: () => toast.error('Failed to update audit status'),
  });
}

export function useCisoReports() {
  return useQuery({
    queryKey: ['ciso', 'reports'],
    queryFn: async () => {
      const response = await api.get('/ciso/reports');
      return response.data.data as CisoReport[];
    },
  });
}

export function useCreateCisoReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, summary }: { title: string; summary?: string }) => {
      const response = await api.post('/ciso/reports', { title, summary, type: 'security' });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'reports'] });
      toast.success('Security report created');
    },
    onError: () => toast.error('Failed to create report'),
  });
}
