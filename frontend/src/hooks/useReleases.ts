import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Release, CreateReleaseDto, UpdateReleaseDto } from '@/types/release';
import toast from 'react-hot-toast';

export function useReleases() {
  const queryClient = useQueryClient();

  const releasesQuery = useQuery({
    queryKey: ['releases'],
    queryFn: async () => {
      const response = await api.get<Release[]>('/product/releases');
      return response.data;
    },
  });

  const createRelease = useMutation({
    mutationFn: async (data: CreateReleaseDto) => {
      const response = await api.post<Release>('/product/releases', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Release created successfully');
    },
    onError: () => {
      toast.error('Failed to create release');
    },
  });

  const updateRelease = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateReleaseDto }) => {
      const response = await api.put<Release>(`/product/releases/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Release updated successfully');
    },
    onError: () => {
      toast.error('Failed to update release');
    },
  });

  const deleteRelease = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/product/releases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Release deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete release');
    },
  });

  return {
    releases: releasesQuery.data || [],
    isLoading: releasesQuery.isLoading,
    error: releasesQuery.error,
    createRelease: createRelease.mutate,
    updateRelease: updateRelease.mutate,
    deleteRelease: deleteRelease.mutate,
    isCreating: createRelease.isPending,
    isUpdating: updateRelease.isPending,
    isDeleting: deleteRelease.isPending,
  };
}

export function useRelease(id: number) {
  return useQuery({
    queryKey: ['releases', id],
    queryFn: async () => {
      const response = await api.get<Release>(`/product/releases/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
