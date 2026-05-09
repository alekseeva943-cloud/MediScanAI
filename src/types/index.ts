// src/types/index.ts

import type {

  MedicalMemory,

  AnalysisSnapshot,

  RouterDecision,

  ResponseMode

} from '../ai/types';

// -----------------------------------
// DANGER LEVEL
// -----------------------------------

export type DangerLevel =

  | 'low'
  | 'medium'
  | 'high';

// -----------------------------------
// INTERVIEW FLOW
// -----------------------------------

export interface InterviewState {

  active: boolean;

  completed?: boolean;

  currentStep: number;

  totalSteps: number;

  currentQuestion: string;

  collectedAnswers: {

    question: string;

    answer: string;

  }[];

  askedQuestions?: string[];

  skippedQuestions?: string[];

  symptomContext?: string;
}

// -----------------------------------
// MEDICATION
// -----------------------------------

export interface MedicationItem {

  name: string;

  action?: string;

  contraindications?: string[];
}

// -----------------------------------
// AI RESPONSE
// -----------------------------------

export interface AIResponse {

  // -----------------------------------
  // MAIN
  // -----------------------------------

  summary?: string;

  message?: string;

  // -----------------------------------
  // ANALYSIS
  // -----------------------------------

  probableDiagnoses?: string[];

  reasoning?: string[];

  risks?: string[];

  recommendations?: string[];

  medications?: MedicationItem[];

  suggested_actions?: string[];

  // -----------------------------------
  // LEGACY SUPPORT
  // -----------------------------------

  possible_risks?: string[];

  medical_warning?: string;

  // -----------------------------------
  // UI
  // -----------------------------------

  quick_replies?: string[];

  quickReplies?: string[];

  // -----------------------------------
  // STATUS
  // -----------------------------------

  interviewCompleted?: boolean;

  danger_level?: DangerLevel;

  render_mode?: ResponseMode;

  router_decision?: RouterDecision;
}

// -----------------------------------
// ATTACHMENT
// -----------------------------------

export interface Attachment {

  type:
    | 'image'
    | 'voice';

  url: string;
}

// -----------------------------------
// MESSAGE
// -----------------------------------

export interface Message {

  id: string;

  role:
    | 'user'
    | 'assistant';

  content: string;

  timestamp: number;

  ai_data?: AIResponse;

  attachments?: Attachment[];
}

// -----------------------------------
// STORE
// -----------------------------------

export interface ChatState {

  // -----------------------------------
  // STATE
  // -----------------------------------

  messages: Message[];

  medicalMemory: MedicalMemory;

  lastAnalysis:
    AnalysisSnapshot | null;

  interviewState:
    InterviewState;

  isLoading: boolean;

  status: string | null;

  error: string | null;

  // -----------------------------------
  // CHAT
  // -----------------------------------

  addMessage: (
    message: Message
  ) => void;

  updateMessage: (
    id: string,

    updates: Partial<Message>
  ) => void;

  // -----------------------------------
  // LOADING
  // -----------------------------------

  setLoading: (

    loading: boolean,

    status?: string | null

  ) => void;

  // -----------------------------------
  // MEMORY
  // -----------------------------------

  setMedicalMemory: (
    memory: Partial<MedicalMemory>
  ) => void;

  // -----------------------------------
  // ANALYSIS
  // -----------------------------------

  setLastAnalysis: (

    analysis:
      AnalysisSnapshot | null

  ) => void;

  // -----------------------------------
  // INTERVIEW
  // -----------------------------------

  setInterviewState: (

    updates:
      Partial<InterviewState>

  ) => void;

  resetInterview: () => void;

  // -----------------------------------
  // ERROR
  // -----------------------------------

  setError: (
    error: string | null
  ) => void;

  // -----------------------------------
  // CLEAR
  // -----------------------------------

  clearHistory: () => void;
}