export type DangerLevel = 'low' | 'medium' | 'high';

export interface AIResponse {
  summary: string;
  is_analysis_needed?: boolean;
  possible_risks: string[];
  recommendations: string[];
  danger_level: DangerLevel;
  suggested_actions: string[];
  medical_warning: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  ai_data?: AIResponse;
  attachments?: {
    type: 'image' | 'voice';
    url: string;
  }[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  status: string | null;
  error: string | null;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean, status?: string | null) => void;
  setError: (error: string | null) => void;
  clearHistory: () => void;
}
