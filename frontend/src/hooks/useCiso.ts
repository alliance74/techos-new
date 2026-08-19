import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export type ProjectAuditStatus = 'needed' | 'in_progress' | 'completed';
export type AuditTaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type AuditTaskStatus = 'todo' | 'in_progress' | 'done';

export interface CisoAuditProject {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectAuditStatus;
  audit_status: ProjectAuditStatus;
  task_count?: number;
  created_at?: string;
  tasks?: CisoTask[];
}

export interface CisoTask {
  id: string;
  title: string;
  description?: string | null;
  status: AuditTaskStatus | string;
  priority: AuditTaskPriority | string;
  project_audit_id: string;
  project_audit_name?: string | null;
  finished: boolean;
  created_at?: string;
}

export interface CisoReport {
  id: string;
  title: string;
  type: string;
  created_at: string;
  data?: { summary?: string };
}

export interface ProjectAuditPayload {
  name: string;
  description?: string;
  status?: ProjectAuditStatus;
}

export interface AuditTaskPayload {
  project_audit_id: string;
  title: string;
  description?: string;
  status?: AuditTaskStatus;
  priority?: AuditTaskPriority;
}

export function useCisoAuditProjects(status?: ProjectAuditStatus) {
  return useQuery({
    queryKey: ['ciso', 'audits', status],
    queryFn: async () => {
      const response = await api.get('/ciso/audits', { params: status ? { status } : undefined });
      return response.data.data as CisoAuditProject[];
    },
  });
}

export function useCisoAudit(id?: string) {
  return useQuery({
    queryKey: ['ciso', 'audits', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/ciso/audits/${id}`);
      return response.data.data as CisoAuditProject;
    },
  });
}

export function useCreateProjectAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProjectAuditPayload) => {
      const response = await api.post('/ciso/audits', payload);
      return response.data.data as CisoAuditProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      toast.success('Project audit created');
    },
    onError: () => toast.error('Failed to create project audit'),
  });
}

export function useUpdateProjectAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ProjectAuditPayload & { id: string }) => {
      const response = await api.put(`/ciso/audits/${id}`, payload);
      return response.data.data as CisoAuditProject;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits', 'detail', variables.id] });
      toast.success('Project audit updated');
    },
    onError: () => toast.error('Failed to update project audit'),
  });
}

export function useDeleteProjectAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/ciso/audits/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-tasks'] });
      toast.success('Project audit deleted');
    },
    onError: () => toast.error('Failed to delete project audit'),
  });
}

export function useCisoTasks(status?: 'finished' | 'not_finished', projectAuditId?: string) {
  return useQuery({
    queryKey: ['ciso', 'audit-tasks', status, projectAuditId],
    queryFn: async () => {
      const response = await api.get('/ciso/audit-tasks', {
        params: {
          ...(status ? { status } : {}),
          ...(projectAuditId ? { project_audit_id: projectAuditId } : {}),
        },
      });
      return response.data.data as CisoTask[];
    },
  });
}

export function useCisoTask(id?: string) {
  return useQuery({
    queryKey: ['ciso', 'audit-tasks', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/ciso/audit-tasks/${id}`);
      return response.data.data as CisoTask;
    },
  });
}

export function useCreateAuditTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AuditTaskPayload) => {
      const response = await api.post('/ciso/audit-tasks', payload);
      return response.data.data as CisoTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      if (task.project_audit_id) {
        queryClient.invalidateQueries({ queryKey: ['ciso', 'audits', 'detail', task.project_audit_id] });
      }
      toast.success('Audit task created');
    },
    onError: () => toast.error('Failed to create audit task'),
  });
}

export function useUpdateAuditTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AuditTaskPayload> & { id: string }) => {
      const response = await api.put(`/ciso/audit-tasks/${id}`, payload);
      return response.data.data as CisoTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-tasks', 'detail', task.id] });
      if (task.project_audit_id) {
        queryClient.invalidateQueries({ queryKey: ['ciso', 'audits', 'detail', task.project_audit_id] });
      }
      toast.success('Audit task updated');
    },
    onError: () => toast.error('Failed to update audit task'),
  });
}

export function useUpdateCisoTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, finished }: { id: string; finished: boolean }) => {
      const response = await api.patch(`/ciso/audit-tasks/${id}/status`, { finished });
      return response.data.data as CisoTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      if (task.project_audit_id) {
        queryClient.invalidateQueries({ queryKey: ['ciso', 'audits', 'detail', task.project_audit_id] });
      }
      toast.success('Task status updated');
    },
    onError: () => toast.error('Failed to update task status'),
  });
}

export function useDeleteAuditTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/ciso/audit-tasks/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audit-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['ciso', 'audits'] });
      toast.success('Audit task deleted');
    },
    onError: () => toast.error('Failed to delete audit task'),
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
