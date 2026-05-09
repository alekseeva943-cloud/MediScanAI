// src/types/index.ts

import {
  MedicalMemory,
  AnalysisSnapshot,
  RouterDecision,
  ResponseMode
} from '../ai/types';

export type DangerLevel =
  'low' |
  'medium' |
  'high';

export interface AIResponse {

  summary: string;

  possible_risks: string[];

  recommendations: string[];

  danger_level: DangerLevel;

  suggested_actions: string[];

  quick_replies: string[];

  medical_warning: string;

  render_mode?: ResponseMode;

  router_decision?: RouterDecision;
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

  medicalMemory: MedicalMemory;

  lastAnalysis:
    AnalysisSnapshot | null;

  isLoading: boolean;

  status: string | null;

  error: string | null;

  addMessage: (
    message: Message
  ) => void;

  updateMessage: (
    id: string,
    updates: Partial<Message>
  ) => void;

  setLoading: (
    loading: boolean,
    status?: string | null
  ) => void;

  setMedicalMemory: (
    memory: Partial<MedicalMemory>
  ) => void;

  setLastAnalysis: (
    analysis: AnalysisSnapshot | null
  ) => void;

  setError: (
    error: string | null
  ) => void;

  clearHistory: () => void;
}