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

// -------------------------
// INTERVIEW FLOW
// -------------------------

export interface InterviewState {

  active: boolean;

  currentStep: number;

  totalSteps: number;

  currentQuestion: string;

  collectedAnswers: string[];
}

// -------------------------
// AI RESPONSE
// -------------------------

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

// -------------------------
// MESSAGE
// -------------------------

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

// -------------------------
// STORE
// -------------------------

export interface ChatState {

  messages: Message[];

  medicalMemory: MedicalMemory;

  lastAnalysis:
    AnalysisSnapshot | null;

  interviewState:
    InterviewState;

  isLoading: boolean;

  status: string | null;

  error: string | null;

  // -------------------------
  // CHAT
  // -------------------------

  addMessage: (
    message: Message
  ) => void;

  updateMessage: (
    id: string,
    updates: Partial<Message>
  ) => void;

  // -------------------------
  // LOADING
  // -------------------------

  setLoading: (
    loading: boolean,
    status?: string | null
  ) => void;

  // -------------------------
  // MEMORY
  // -------------------------

  setMedicalMemory: (
    memory: Partial<MedicalMemory>
  ) => void;

  // -------------------------
  // ANALYSIS
  // -------------------------

  setLastAnalysis: (
    analysis: AnalysisSnapshot | null
  ) => void;

  // -------------------------
  // INTERVIEW FLOW
  // -------------------------

  setInterviewState: (
    updates: Partial<InterviewState>
  ) => void;

  resetInterview: () => void;

  // -------------------------
  // ERROR
  // -------------------------

  setError: (
    error: string | null
  ) => void;

  // -------------------------
  // CLEAR
  // -------------------------

  clearHistory: () => void;
}