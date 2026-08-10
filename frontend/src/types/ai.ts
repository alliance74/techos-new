export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: number;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskAnalysis {
  area: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface PrioritySuggestion {
  item: string;
  type: string;
  priority: number;
  reasoning: string;
}

export interface ReportGeneration {
  content: string;
  type: string;
}
