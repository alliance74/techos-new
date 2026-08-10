import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function useMessageThread(messageId: string) {
  return useQuery({
    queryKey: ['messages', messageId, 'thread'],
    queryFn: async () => {
      const response = await api.get(`/messages/${messageId}/thread`);
      return response.data.data || response.data;
    },
    enabled: !!messageId,
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both channel messages and thread messages since the reaction could be in either
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.messageId, 'thread'] });
    },
    onError: () => {
      toast.error('Failed to add reaction');
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.delete(`/messages/${messageId}/reactions/${emoji}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.messageId, 'thread'] });
    },
    onError: () => {
      toast.error('Failed to remove reaction');
    },
  });
}

export function useSearchMessages(channelId: string, query: string) {
  return useQuery({
    queryKey: ['channels', channelId, 'messages', 'search', query],
    queryFn: async () => {
      const response = await api.get(`/messages/channel/${channelId}/search`, { params: { q: query } });
      return response.data.data || response.data;
    },
    enabled: !!channelId && !!query && query.length > 2,
  });
}
