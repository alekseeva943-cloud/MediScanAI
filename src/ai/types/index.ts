// src/ai/types/index.ts

// -----------------------------------------------------
// USER INTENT
// -----------------------------------------------------

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

// -----------------------------------------------------
// RESPONSE MODE
// -----------------------------------------------------

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

// -----------------------------------------------------
// ROUTER
// -----------------------------------------------------

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

// -----------------------------------------------------
// ACTIVE MEDICAL CASE
// -----------------------------------------------------

export interface ActiveMedicalCase {

  chiefComplaint?: string;

  probableCause?: string;

  confirmedSymptoms?: string[];

  deniedSymptoms?: string[];

  resolvedSymptoms?: string[];

  detectedTriggers?: string[];

  possibleConditions?: string[];

  excludedConditions?: string[];

  recommendations?: string[];

  redFlags?: string[];

  alreadyAskedQuestions?: string[];

  dangerLevel?:
    | "low"
    | "medium"
    | "high";

  aiSummary?: string;

  interviewCompleted?: boolean;
}

// -----------------------------------------------------
// LEGACY MEMORY
// -----------------------------------------------------

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

  // NEW

  activeCase?: ActiveMedicalCase;
}

// -----------------------------------------------------
// PATIENT PROFILE UPDATE
// -----------------------------------------------------

export interface PatientProfileUpdate {

  firstName?: string;

  lastName?: string;

  age?: number;

  gender?:
    | "male"
    | "female"
    | "other";

  allergies?: string[];

  chronicConditions?: string[];

  medications?: string[];

  surgeries?: string[];

  familyHistory?: string[];

  riskFactors?: string[];
}

// -----------------------------------------------------
// MEDICAL CASE UPDATE
// -----------------------------------------------------

export interface MedicalCaseUpdate {

  chiefComplaint?: string;

  probableCause?: string;

  confirmedSymptoms?: string[];

  deniedSymptoms?: string[];

  resolvedSymptoms?: string[];

  detectedTriggers?: string[];

  possibleConditions?: string[];

  excludedConditions?: string[];

  recommendations?: string[];

  redFlags?: string[];

  alreadyAskedQuestions?: string[];

  dangerLevel?:
    | "low"
    | "medium"
    | "high";

  aiSummary?: string;

  interviewCompleted?: boolean;
}

// -----------------------------------------------------
// AI MEDICAL UPDATE RESULT
// -----------------------------------------------------

export interface AIMedicalUpdateResult {

  patientProfileUpdates?:
    PatientProfileUpdate;

  medicalCaseUpdates?:
    MedicalCaseUpdate;
}

// -----------------------------------------------------
// MEDICATION
// -----------------------------------------------------

export interface MedicationItem {

  name: string;

  action?: string;

  contraindications?: string[];
}

// -----------------------------------------------------
// ANALYSIS SNAPSHOT
// -----------------------------------------------------

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