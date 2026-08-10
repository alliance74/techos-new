import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Contact, Deal, Pipeline, LeadScore } from '@/types/crm';
import toast from 'react-hot-toast';

// Contacts
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await api.get('/crm/contacts');
      return response.data.data as Contact[];
    },
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const response = await api.get(`/crm/contacts/${id}`);
      return response.data.data as Contact;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const response = await api.post('/crm/contacts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create contact');
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const response = await api.put(`/crm/contacts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update contact');
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/crm/contacts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete contact');
    },
  });
}

// Deals
export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await api.get('/crm/deals');
      return response.data.data as Deal[];
    },
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      const response = await api.get(`/crm/deals/${id}`);
      return response.data.data as Deal;
    },
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Deal>) => {
      const response = await api.post('/crm/deals', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create deal');
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Deal> }) => {
      const response = await api.put(`/crm/deals/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update deal');
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/crm/deals/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete deal');
    },
  });
}

// Lead Scores
export function useLeadScores() {
  return useQuery({
    queryKey: ['lead-scores'],
    queryFn: async () => {
      const response = await api.get('/crm/lead-scores');
      return response.data.data as LeadScore[];
    },
  });
}

export function useContactLeadScore(contactId: string, enabled = true) {
  return useQuery({
    queryKey: ['lead-score', contactId],
    queryFn: async () => {
      const response = await api.get(`/crm/contacts/${contactId}/score`);
      return response.data.data as { contact_id: string; score: number; rating: string };
    },
    enabled: !!contactId && enabled,
  });
}

export function useCalculateLeadScore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await api.post(`/crm/lead-scores/${contactId}/calculate`);
      return response.data;
    },
    onSuccess: (_data, contactId) => {
      queryClient.invalidateQueries({ queryKey: ['lead-scores'] });
      queryClient.invalidateQueries({ queryKey: ['lead-score', contactId] });
      toast.success('Lead score calculated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to calculate lead score');
    },
  });
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: async () => {
      const response = await api.get('/crm/pipeline/stats');
      return response.data.data;
    },
  });
}

// Pipelines
export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const response = await api.get('/crm/pipelines');
      return response.data.data as Pipeline[];
    },
  });
}
