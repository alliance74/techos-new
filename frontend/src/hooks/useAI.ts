import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface AIMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  edited?: boolean;
  editedAt?: string;
  tokens?: number;
}

export interface AIConversation {
  id: string;
  title: string;
  provider: string;
  summary?: string;
  messageCount: number;
  tokensUsed: number;
  archived: boolean;
  messages?: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  provider?: string;
  conversationId?: number;
}

export interface ReportRequest {
  type: string;
  entityId?: number;
  provider?: string;
}

export interface UsageStats {
  current: {
    messages: number;
    conversations: number;
    tokens: number;
  };
  limits: {
    messages: number;
    conversations: number;
  };
  percentage: {
    messages: number;
    conversations: number;
  };
  periodStart: string;
  periodEnd: string;
}

// Conversations
export function useAIConversations(archived: boolean = false) {
  return useQuery({
    queryKey: ['ai-conversations', archived],
    queryFn: async () => {
      const response = await api.get(`/ai/conversations?archived=${archived}`);
      return response.data;
    },
  });
}

export function useAIConversation(id: string | null) {
  return useQuery({
    queryKey: ['ai-conversation', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/ai/conversations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; provider?: string }) => {
      const response = await api.post('/ai/conversations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Conversation created');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create conversation';
      toast.error(message);
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; summary?: string; archived?: boolean } }) => {
      const response = await api.put(`/ai/conversations/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', variables.id] });
      toast.success('Conversation updated');
    },
    onError: () => {
      toast.error('Failed to update conversation');
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/ai/conversations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Conversation deleted');
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    },
  });
}

// Messages
export function useSendMessageInConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      const response = await api.post(`/ai/conversations/${conversationId}/messages`, { message });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const response = await api.put(`/ai/messages/${messageId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversation'] });
      toast.success('Message updated');
    },
    onError: () => {
      toast.error('Failed to update message');
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.delete(`/ai/messages/${messageId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversation'] });
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });
}

// Usage tracking
export function useAIUsage() {
  return useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const response = await api.get('/ai/usage');
      return response.data as UsageStats;
    },
  });
}

// Legacy chat (no conversation)
export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (data: ChatRequest) => {
      const response = await api.post('/ai/chat', data);
      return response.data;
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });
}

// Generate Report
export function useGenerateReport() {
  return useMutation({
    mutationFn: async (data: ReportRequest) => {
      const response = await api.get('/ai/generate-report', {
        params: {
          type: data.type,
          provider: data.provider,
        },
      });
      return response.data;
    },
    onError: () => {
      toast.error('Failed to generate report');
    },
  });
}

// Risk Analysis
export function useAnalyzeRisk() {
  return useMutation({
    mutationFn: async (provider: string) => {
      const response = await api.get('/ai/analyze-risk', {
        params: { provider },
      });
      return response.data;
    },
    onError: () => {
      toast.error('Failed to analyze risks');
    },
  });
}

// Priority Suggestions
export function useSuggestPriorities() {
  return useMutation({
    mutationFn: async (provider: string) => {
      const response = await api.get('/ai/suggest-priorities', {
        params: { provider },
      });
      return response.data;
    },
    onError: () => {
      toast.error('Failed to suggest priorities');
    },
  });
}

// Legacy exports for compatibility
export const useAIChat = useSendChatMessage;
export const useAIReport = useGenerateReport;
export const useAIRiskAnalysis = useAnalyzeRisk;
export const useAIPriority = useSuggestPriorities;
