// src/ai/types/index.ts

export enum ResponseMode {
  CASUAL_CONVERSATION = 'CASUAL_CONVERSATION',
  CLARIFICATION_MODE = 'CLARIFICATION_MODE',
  PRELIMINARY_ANALYSIS = 'PRELIMINARY_ANALYSIS',
  FULL_MEDICAL_ANALYSIS = 'FULL_MEDICAL_ANALYSIS',
  ANALYSIS_UPDATE_MODE = 'ANALYSIS_UPDATE_MODE',
  EMERGENCY_WARNING_MODE = 'EMERGENCY_WARNING_MODE',
}

export enum UserIntent {
  CASUAL_CHAT = 'CASUAL_CHAT',
  SYMPTOM_ANALYSIS = 'SYMPTOM_ANALYSIS',
  MEDICATION_CHECK = 'MEDICATION_CHECK',
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  EMERGENCY_RISK = 'EMERGENCY_RISK',
  FOLLOW_UP = 'FOLLOW_UP',
}

export interface MedicalMemory {
  symptoms: string[];
  medications: string[];
  diagnoses: string[];
  allergies: string[];
  riskFactors: string[];
  uploadedDocuments: string[];
  extractedFacts: string[];

  age?: string;
  sex?: string;

  chronicConditions?: string[];
  surgeries?: string[];
  familyHistory?: string[];
}

export interface AnalysisSnapshot {
  timestamp: number;

  summary: string;

  probableDiagnoses: string[];

  risks: string[];

  medications: Array<{
    name: string;
    action: string;
    contraindications: string[];
  }>;

  recommendations: string[];

  dangerLevel: 'low' | 'medium' | 'high';

  suggestedActions: string[];
}

export interface RouterDecision {
  intent: UserIntent;

  mode: ResponseMode;

  needsClarification: boolean;

  clarificationQuestions: string[];

  emergencyLevel: 'low' | 'medium' | 'high';

  isUpdateToExisting: boolean;
}