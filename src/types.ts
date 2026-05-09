// src/types.ts

export interface Attachment {

  type:
    | 'image'
    | 'voice'
    | 'file';

  url: string;
}

export interface RouterDecision {

  intent?: string;

  mode?:
    | 'CASUAL_CONVERSATION'
    | 'CLARIFICATION_MODE'
    | 'FULL_MEDICAL_ANALYSIS'
    | 'ANALYSIS_UPDATE_MODE'
    | 'EMERGENCY_WARNING_MODE';

  needsClarification?: boolean;

  clarificationQuestions?: string[];

  emergencyLevel?:
    | 'low'
    | 'medium'
    | 'high';

  isUpdateToExisting?: boolean;

  question?: string;

  quickReplies?: string[];

  interviewCompleted?: boolean;
}

export interface AIResponse {

  summary: string;

  possible_risks: string[];

  recommendations: string[];

  danger_level:
    | 'low'
    | 'medium'
    | 'high';

  suggested_actions: string[];

  quick_replies: string[];

  medical_warning: string;

  render_mode?: string;

  router_decision?: RouterDecision;
}

export interface Message {

  id: string;

  role:
    | 'user'
    | 'assistant'
    | 'system';

  content: string;

  timestamp: number;

  attachments?: Attachment[];

  ai_data?: AIResponse;
}

export interface MedicalMemory {

  symptoms: string[];

  medications: string[];

  diagnoses: string[];

  allergies: string[];

  riskFactors: string[];

  uploadedDocuments: string[];

  extractedFacts: string[];

  chronicConditions: string[];

  surgeries: string[];

  familyHistory: string[];
}

export interface AnalysisSnapshot {

  summary?: string;

  findings?: string[];

  recommendations?: string[];

  risks?: string[];

  emergencyLevel?:
    | 'low'
    | 'medium'
    | 'high';

  createdAt?: number;

  raw?: any;
}