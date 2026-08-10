import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getEntityApi } from '@/lib/entityApi';

function unwrapList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function unwrapItem(payload: any): any {
  if (payload?.data?.data) return payload.data.data;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

export function useEntityList(entityKey: string) {
  const config = getEntityApi(entityKey);
  return useQuery({
    queryKey: ['entity', entityKey, config.listParams || null],
    queryFn: async () => {
      const response = await api.get(config.listPath, {
        params: config.listParams,
      });
      let rows = unwrapList(response.data);
      if (config.listFilter) {
        rows = rows.filter(config.listFilter);
      }
      return rows.map((row) => config.toUi(row));
    },
  });
}

export function useEntityItem(entityKey: string, id: string) {
  const config = getEntityApi(entityKey);
  return useQuery({
    queryKey: ['entity', entityKey, id],
    queryFn: async () => {
      const response = await api.get(config.itemPath(id));
      return config.toUi(unwrapItem(response.data));
    },
    enabled: !!id,
  });
}

export function useCreateEntity(entityKey: string) {
  const queryClient = useQueryClient();
  const config = getEntityApi(entityKey);
  return useMutation({
    mutationFn: async (form: Record<string, any>) => {
      const response = await api.post(config.createPath, config.toCreateBody(form));
      return unwrapItem(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityKey] });
      toast.success('Created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create');
    },
  });
}

export function useUpdateEntity(entityKey: string) {
  const queryClient = useQueryClient();
  const config = getEntityApi(entityKey);
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const body = config.toCreateBody(data);
      const cleaned = Object.fromEntries(
        Object.entries(body).filter(([, value]) => value !== undefined),
      );
      const response = await api.put(config.itemPath(id), cleaned);
      return unwrapItem(response.data);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityKey] });
      queryClient.invalidateQueries({ queryKey: ['entity', entityKey, vars.id] });
      toast.success('Updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update');
    },
  });
}

export function useDeleteEntity(entityKey: string) {
  const queryClient = useQueryClient();
  const config = getEntityApi(entityKey);
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(config.itemPath(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityKey] });
      toast.success('Deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete');
    },
  });
}

export function useEntityActivity(entityType?: string, entityId?: string, actorId?: string) {
  return useQuery({
    queryKey: ['activity', entityType, entityId, actorId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entityType) params.set('entity_type', entityType);
      if (entityId) params.set('entity_id', entityId);
      if (actorId) params.set('actor_id', actorId);
      const qs = params.toString();
      const response = await api.get(`/workspace/activity${qs ? `?${qs}` : ''}`);
      return unwrapList(response.data);
    },
  });
}

export type RecordCommentDto = {
  id: string;
  entity_type: string;
  entity_id: string;
  body: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at?: string;
};

export function useEntityComments(entityType?: string, entityId?: string) {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      const response = await api.get('/workspace/comments', {
        params: { entity_type: entityType, entity_id: entityId },
      });
      return unwrapList(response.data) as RecordCommentDto[];
    },
    enabled: Boolean(entityType && entityId),
    refetchInterval: 15_000,
  });
}

export function useCreateComment(entityType: string, entityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const response = await api.post('/workspace/comments', {
        entity_type: entityType,
        entity_id: entityId,
        body,
      });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['activity', entityType, entityId] });
      toast.success('Comment posted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to post comment');
    },
  });
}

export function useDeleteComment(entityType: string, entityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/workspace/comments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      toast.success('Comment deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete comment');
    },
  });
}
