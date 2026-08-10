import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bug, CreateBugDto, UpdateBugDto } from '@/types/bug';
import toast from 'react-hot-toast';

export function useBugs() {
  const queryClient = useQueryClient();

  const bugsQuery = useQuery({
    queryKey: ['bugs'],
    queryFn: async () => {
      const response = await api.get<Bug[]>('/product/bugs');
      return response.data;
    },
  });

  const createBug = useMutation({
    mutationFn: async (data: CreateBugDto) => {
      const response = await api.post<Bug>('/product/bugs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug created successfully');
    },
    onError: () => {
      toast.error('Failed to create bug');
    },
  });

  const updateBug = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBugDto }) => {
      const response = await api.put<Bug>(`/product/bugs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug updated successfully');
    },
    onError: () => {
      toast.error('Failed to update bug');
    },
  });

  const deleteBug = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/product/bugs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete bug');
    },
  });

  return {
    bugs: bugsQuery.data || [],
    isLoading: bugsQuery.isLoading,
    error: bugsQuery.error,
    createBug: createBug.mutate,
    updateBug: updateBug.mutate,
    deleteBug: deleteBug.mutate,
    isCreating: createBug.isPending,
    isUpdating: updateBug.isPending,
    isDeleting: deleteBug.isPending,
  };
}

export function useBug(id: number) {
  return useQuery({
    queryKey: ['bugs', id],
    queryFn: async () => {
      const response = await api.get<Bug>(`/product/bugs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
