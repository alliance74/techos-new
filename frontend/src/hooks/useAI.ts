import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export interface AIMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AIConversation {
  id: number;
  title: string;
  messages: AIMessage[];
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

// Conversations — Nest has no list endpoint yet; keep chat local-only.
export function useAIConversations() {
  return useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => [] as AIConversation[],
    enabled: false,
    initialData: [],
  });
}

// Chat
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
