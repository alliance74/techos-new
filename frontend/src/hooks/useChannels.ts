import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Channel, Message } from '@/types/channel';
import toast from 'react-hot-toast';
import { isRealtimeEnabled } from '@/lib/socket';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await api.get('/channels');
      return response.data.data as Channel[];
    },
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['channels', id],
    queryFn: async () => {
      const response = await api.get(`/channels/${id}`);
      return response.data.data as Channel;
    },
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Channel> & { member_ids?: string[] }) => {
      const response = await api.post('/channels', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Channel created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create channel');
    },
  });
}

export function useOpenDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post('/channels/direct', { user_id: userId });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Unable to open direct message');
    },
  });
}

export function useMarkChannelRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const response = await api.put(`/channels/${channelId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useAddChannelMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, memberIds }: { channelId: string; memberIds: string[] }) => {
      const response = await api.post(`/channels/${channelId}/members`, {
        member_ids: memberIds,
      });
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['channels', vars.channelId] });
      toast.success('Members added');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add members');
    },
  });
}

export function useChannelMessages(channelId: string) {
  return useQuery({
    queryKey: ['channels', channelId, 'messages'],
    queryFn: async () => {
      const response = await api.get(`/channels/${channelId}/messages`);
      return response.data.data as Message[];
    },
    enabled: !!channelId,
    refetchInterval: isRealtimeEnabled() ? false : 4000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      content,
      parentMessageId,
    }: {
      channelId: string;
      content: string;
      parentMessageId?: string;
    }) => {
      const response = await api.post(`/channels/${channelId}/messages`, {
        content,
        parent_message_id: parentMessageId,
      });
      return response.data?.data || response.data;
    },
    onSuccess: (message, variables) => {
      if (variables.parentMessageId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', variables.parentMessageId, 'thread'],
        });
        queryClient.invalidateQueries({
          queryKey: ['channels', variables.channelId, 'messages'],
        });
        return;
      }
      queryClient.setQueryData(['channels', variables.channelId, 'messages'], (old: any) => {
        const list = Array.isArray(old) ? old : [];
        if (!message?.id) return list;
        if (list.some((m: any) => m.id === message.id)) return list;
        return [...list, message];
      });
      queryClient.invalidateQueries({ queryKey: ['channels', variables.channelId, 'messages'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
}
