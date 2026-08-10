import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/** Nest analytics endpoints return `{ success, data }` — expose `data` only. */
function asData<T>(response: { data?: { data?: T } }): T {
  return response.data?.data as T;
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return asData(response);
    },
  });
}

export function useProjectAnalytics(projectId?: string) {
  return useQuery({
    queryKey: ['analytics', 'projects', projectId],
    queryFn: async () => {
      const response = await api.get('/analytics/projects', {
        params: projectId ? { project_id: projectId } : undefined,
      });
      return asData(response);
    },
  });
}

export function useTeamProductivity(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'team-productivity', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/analytics/team-productivity', {
        params: {
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
        },
      });
      return asData(response) as Array<{
        user_id: string;
        user_name: string;
        total_tasks: number;
        completed_tasks: number;
        in_progress_tasks: number;
        completion_rate: number;
        total_logged_hours: number;
      }>;
    },
  });
}

export function useSprintAnalytics(sprintId?: string) {
  return useQuery({
    queryKey: ['analytics', 'sprints', sprintId],
    queryFn: async () => {
      const response = await api.get('/analytics/sprints', {
        params: sprintId ? { sprint_id: sprintId } : undefined,
      });
      return asData(response);
    },
  });
}

export function useBugAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'bugs'],
    queryFn: async () => {
      const response = await api.get('/analytics/bugs');
      return asData(response) as {
        total_bugs: number;
        open_bugs: number;
        in_progress_bugs: number;
        resolved_bugs: number;
        closed_bugs: number;
        by_severity: Record<string, number>;
        by_priority: Record<string, number>;
      };
    },
  });
}

export function useTimeTracking(userId?: string, projectId?: string) {
  return useQuery({
    queryKey: ['analytics', 'time-tracking', userId, projectId],
    queryFn: async () => {
      const response = await api.get('/analytics/time-tracking', {
        params: {
          ...(userId ? { user_id: userId } : {}),
          ...(projectId ? { project_id: projectId } : {}),
        },
      });
      return asData(response) as {
        total_estimated_hours: number;
        total_logged_hours: number;
        tasks_with_time_logged: number;
        average_logged_per_task: number;
        efficiency_rate: number;
      };
    },
  });
}

export function useKPIs(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['analytics', 'kpis', filters],
    queryFn: async () => {
      const response = await api.get('/analytics/kpis', { params: filters });
      return (asData(response) || []) as Array<{
        id: string;
        name: string;
        target: number;
        current: number;
        unit: string;
        category?: string;
        frequency?: string;
      }>;
    },
  });
}

export function useCreateKPI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      target: number;
      current?: number;
      unit: string;
      category?: string;
      frequency?: string;
      description?: string;
    }) => {
      const response = await api.post('/analytics/kpis', {
        frequency: 'monthly',
        ...data,
      });
      return asData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'kpis'] });
    },
  });
}

export function useUpdateKPI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await api.put(`/analytics/kpis/${id}`, data);
      return asData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'kpis'] });
    },
  });
}
