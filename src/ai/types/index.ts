// src/ai/types/index.ts

export enum UserIntent {

  SYMPTOM_ANALYSIS =
    "SYMPTOM_ANALYSIS",

  CASUAL_CHAT =
    "CASUAL_CHAT",

  MEDICAL_DOCUMENT_ANALYSIS =
    "MEDICAL_DOCUMENT_ANALYSIS",

  FOLLOW_UP =
    "FOLLOW_UP"
}

export enum ResponseMode {

  CASUAL_CONVERSATION =
    "CASUAL_CONVERSATION",

  CLARIFICATION_MODE =
    "CLARIFICATION_MODE",

  FULL_MEDICAL_ANALYSIS =
    "FULL_MEDICAL_ANALYSIS",

  ANALYSIS_UPDATE_MODE =
    "ANALYSIS_UPDATE_MODE",

  EMERGENCY_WARNING_MODE =
    "EMERGENCY_WARNING_MODE"
}

// -----------------------------------
// ROUTER
// -----------------------------------

export interface RouterDecision {

  intent: UserIntent;

  mode: ResponseMode;

  needsClarification: boolean;

  clarificationQuestions: string[];

  emergencyLevel:
    | "low"
    | "medium"
    | "high";

  isUpdateToExisting: boolean;

  question?: string;

  quickReplies?: string[];

  interviewCompleted?: boolean;
}

// -----------------------------------
// MEMORY
// -----------------------------------

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

  age?: string;

  sex?: string;
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
// ANALYSIS SNAPSHOT
// -----------------------------------

export interface AnalysisSnapshot {

  summary: string;

  probableDiagnoses?: string[];

  reasoning?: string[];

  findings?: string[];

  recommendations?: string[];

  risks?: string[];

  medications?: MedicationItem[];

  suggested_actions?: string[];

  quick_replies?: string[];

  danger_level?:
    | "low"
    | "medium"
    | "high";

  interviewCompleted?: boolean;

  timestamp?: number;

  createdAt?: number;

  raw?: any;
}