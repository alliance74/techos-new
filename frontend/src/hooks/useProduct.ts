import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Feature, Bug, Release, Epic, CreateFeatureDto, UpdateFeatureDto, CreateBugDto, UpdateBugDto, CreateReleaseDto, UpdateReleaseDto } from '@/types/product';

// Features
export const useFeatures = () => {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const response = await api.get('/product/features');
      return response.data.data as Feature[];
    },
  });
};

export const useFeature = (id: string) => {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: async () => {
      const response = await api.get(`/product/features/${id}`);
      return response.data.data as Feature;
    },
    enabled: !!id,
  });
};

export const useCreateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateFeatureDto) => {
      const response = await api.post('/product/features', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature created successfully');
    },
    onError: () => {
      toast.error('Failed to create feature');
    },
  });
};

export const useUpdateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFeatureDto }) => {
      const response = await api.put(`/product/features/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature updated successfully');
    },
    onError: () => {
      toast.error('Failed to update feature');
    },
  });
};

export const useDeleteFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/product/features/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete feature');
    },
  });
};

export const useVoteFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/product/features/${id}/vote`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Vote recorded');
    },
    onError: () => {
      toast.error('Failed to vote');
    },
  });
};

// Bugs
export const useBugs = () => {
  return useQuery({
    queryKey: ['bugs'],
    queryFn: async () => {
      const response = await api.get('/product/bugs');
      return response.data.data as Bug[];
    },
  });
};

export const useBug = (id: string) => {
  return useQuery({
    queryKey: ['bug', id],
    queryFn: async () => {
      const response = await api.get(`/product/bugs/${id}`);
      return response.data.data as Bug;
    },
    enabled: !!id,
  });
};

export const useCreateBug = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBugDto) => {
      const response = await api.post('/product/bugs', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug reported successfully');
    },
    onError: () => {
      toast.error('Failed to report bug');
    },
  });
};

export const useUpdateBug = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBugDto }) => {
      const response = await api.put(`/product/bugs/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      toast.success('Bug updated successfully');
    },
    onError: () => {
      toast.error('Failed to update bug');
    },
  });
};

export const useDeleteBug = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
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
};

// Releases
export const useReleases = () => {
  return useQuery({
    queryKey: ['releases'],
    queryFn: async () => {
      const response = await api.get('/product/releases');
      return response.data.data as Release[];
    },
  });
};

export const useRelease = (id: string) => {
  return useQuery({
    queryKey: ['release', id],
    queryFn: async () => {
      const response = await api.get(`/product/releases/${id}`);
      return response.data.data as Release;
    },
    enabled: !!id,
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateReleaseDto) => {
      const response = await api.post('/product/releases', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Release created successfully');
    },
    onError: () => {
      toast.error('Failed to create release');
    },
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReleaseDto }) => {
      const response = await api.put(`/product/releases/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      toast.success('Release updated successfully');
    },
    onError: () => {
      toast.error('Failed to update release');
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
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
};

// Epics
export const useEpics = () => {
  return useQuery({
    queryKey: ['epics'],
    queryFn: async () => {
      const response = await api.get('/product/epics');
      return response.data.data as Epic[];
    },
  });
};
