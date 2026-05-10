// src/types.ts

// -----------------------------------------------------
// ATTACHMENTS
// -----------------------------------------------------

export interface Attachment {

  type:
  | 'image'
  | 'voice'
  | 'file'
  | 'mri'
  | 'analysis'
  | 'document';

  url: string;

  name?: string;

  uploadedAt?: number;
}

// -----------------------------------------------------
// ROUTER DECISION
// -----------------------------------------------------

export interface RouterDecision {

  intent?: string;

  mode?:
  | 'CASUAL_CONVERSATION'
  | 'CLARIFICATION_MODE'
  | 'FULL_MEDICAL_ANALYSIS'
  | 'ANALYSIS_UPDATE_MODE'
  | 'EMERGENCY_WARNING_MODE'
  | 'REPORT_MODE';

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

  probableCause?: string;
}

// -----------------------------------------------------
// AI RESPONSE
// -----------------------------------------------------

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

  interviewCompleted?: boolean;

  message?: string;
}

// -----------------------------------------------------
// MESSAGE
// -----------------------------------------------------

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

// -----------------------------------------------------
// PATIENT PROFILE
// -----------------------------------------------------

export interface PatientProfile {

  id: string;

  firstName?: string;

  lastName?: string;

  middleName?: string;

  age?: number;

  gender?:
  | 'male'
  | 'female'
  | 'other';

  height?: number;

  weight?: number;

  allergies: string[];

  chronicConditions: string[];

  medications: string[];

  surgeries: string[];

  familyHistory: string[];

  badHabits: string[];

  riskFactors: string[];

  createdAt: number;

  updatedAt: number;
}

// -----------------------------------------------------
// MEDICAL DOCUMENT
// -----------------------------------------------------

export interface MedicalDocument {

  id: string;

  type:
  | 'analysis'
  | 'mri'
  | 'xray'
  | 'photo'
  | 'prescription'
  | 'other';

  title: string;

  url: string;

  extractedText?: string;

  aiSummary?: string;

  uploadedAt: number;
}

// -----------------------------------------------------
// CASE TIMELINE EVENT
// -----------------------------------------------------

export interface CaseTimelineEvent {

  id: string;

  type:
  | 'symptom'
  | 'upload'
  | 'ai_update'
  | 'report'
  | 'user_note';

  title: string;

  description?: string;

  createdAt: number;
}

// -----------------------------------------------------
// MEDICAL CASE
// -----------------------------------------------------

export interface MedicalCase {

  id: string;

  title: string;

  chiefComplaint: string;

  status:
  | 'active'
  | 'monitoring'
  | 'resolved';

  probableCause: string;

  confidence:
  | 'low'
  | 'medium'
  | 'high';

  dangerLevel:
  | 'low'
  | 'medium'
  | 'high';

  symptoms: string[];

  confirmedSymptoms: string[];

  excludedSymptoms: string[];

  detectedTriggers: string[];

  possibleConditions: string[];

  excludedConditions: string[];

  recommendations: string[];

  redFlags: string[];

  followUpQuestions: string[];

  uploadedDocuments: string[];

  timeline: CaseTimelineEvent[];

  aiSummary?: string;

  clarificationCount: number;

  interviewCompleted: boolean;

  reportGenerated: boolean;

  createdAt: number;

  updatedAt: number;
}

// -----------------------------------------------------
// LEGACY MEMORY
// -----------------------------------------------------

// Оставляем временно для совместимости.
// Потом удалим полностью.

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

  patientProfile?: PatientProfile;
}

// -----------------------------------------------------
// ANALYSIS SNAPSHOT
// -----------------------------------------------------

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