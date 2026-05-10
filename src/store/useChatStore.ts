// src/store/useChatStore.ts

import { create } from 'zustand';

import type {

  Message,

  MedicalCase,

  MedicalDocument,

  PatientProfile,

  MedicalMemory

} from '../types';

// -----------------------------------------------------
// STORE INTERFACE
// -----------------------------------------------------

interface ChatStore {

  // -----------------------------------------------------
  // CHAT
  // -----------------------------------------------------

  messages: Message[];

  isLoading: boolean;

  status: string | null;

  error: string | null;

  // -----------------------------------------------------
  // PATIENT
  // -----------------------------------------------------

  patientProfile: PatientProfile | null;

  // -----------------------------------------------------
  // CASES
  // -----------------------------------------------------

  activeCase: MedicalCase | null;

  medicalCases: MedicalCase[];

  // -----------------------------------------------------
  // DOCUMENTS
  // -----------------------------------------------------

  documents: MedicalDocument[];

  // -----------------------------------------------------
  // LEGACY
  // -----------------------------------------------------

  medicalMemory: MedicalMemory;

  lastAnalysis: any;

  // -----------------------------------------------------
  // CHAT ACTIONS
  // -----------------------------------------------------

  addMessage:
  (message: Message) => void;

  updateMessage:
  (
    id: string,
    updates: Partial<Message>
  ) => void;

  clearHistory:
  () => void;

  setLoading:
  (
    loading: boolean,
    status?: string | null
  ) => void;

  setError:
  (
    error: string | null
  ) => void;

  // -----------------------------------------------------
  // PATIENT ACTIONS
  // -----------------------------------------------------

  setPatientProfile:
  (
    profile: PatientProfile
  ) => void;

  updatePatientProfile:
  (
    updates: Partial<PatientProfile>
  ) => void;

  resetPatientProfile:
  () => void;

  // -----------------------------------------------------
  // CASE ACTIONS
  // -----------------------------------------------------

  setActiveCase:
  (
    medicalCase: MedicalCase
  ) => void;

  updateActiveCase:
  (
    updates: Partial<MedicalCase>
  ) => void;

  addMedicalCase:
  (
    medicalCase: MedicalCase
  ) => void;

  archiveActiveCase:
  () => void;

  resetActiveCase:
  () => void;

  // -----------------------------------------------------
  // DOCUMENTS
  // -----------------------------------------------------

  addDocument:
  (
    document: MedicalDocument
  ) => void;

  removeDocument:
  (
    id: string
  ) => void;

  // -----------------------------------------------------
  // LEGACY ACTIONS
  // -----------------------------------------------------

  setMedicalMemory:
  (
    memory: MedicalMemory
  ) => void;

  setLastAnalysis:
  (
    analysis: any
  ) => void;
}

// -----------------------------------------------------
// INITIAL PATIENT PROFILE
// -----------------------------------------------------

const initialPatientProfile:
  PatientProfile = {

  id: 'default-patient',

  allergies: [],

  chronicConditions: [],

  medications: [],

  surgeries: [],

  familyHistory: [],

  badHabits: [],

  riskFactors: [],

  createdAt:
    Date.now(),

  updatedAt:
    Date.now()
};

// -----------------------------------------------------
// INITIAL MEDICAL CASE
// -----------------------------------------------------

const initialMedicalCase:
  MedicalCase = {

  id: 'active-case',

  title: 'Новое обращение',

  chiefComplaint: '',

  status: 'active',

  probableCause: '',

  confidence: 'low',

  dangerLevel: 'low',

  symptoms: [],

  confirmedSymptoms: [],

  excludedSymptoms: [],

  detectedTriggers: [],

  possibleConditions: [],

  excludedConditions: [],

  recommendations: [],

  redFlags: [],

  followUpQuestions: [],

  uploadedDocuments: [],

  timeline: [],

  aiSummary: '',

  clarificationCount: 0,

  interviewCompleted: false,

  reportGenerated: false,

  createdAt:
    Date.now(),

  updatedAt:
    Date.now()
};

// -----------------------------------------------------
// INITIAL MEMORY
// -----------------------------------------------------

const initialMedicalMemory:
  MedicalMemory = {
    
  patientProfile:
    initialPatientProfile,

  symptoms: [],

  medications: [],

  diagnoses: [],

  allergies: [],

  riskFactors: [],

  uploadedDocuments: [],

  extractedFacts: [],

  chronicConditions: [],

  surgeries: [],

  familyHistory: []
};

// -----------------------------------------------------
// STORE
// -----------------------------------------------------

export const useChatStore =
  create<ChatStore>((set, get) => ({

    // -----------------------------------------------------
    // CHAT
    // -----------------------------------------------------

    messages: [],

    isLoading: false,

    status: null,

    error: null,

    // -----------------------------------------------------
    // PATIENT
    // -----------------------------------------------------

    patientProfile:
      initialPatientProfile,

    // -----------------------------------------------------
    // CASES
    // -----------------------------------------------------

    activeCase:
      initialMedicalCase,

    medicalCases: [],

    // -----------------------------------------------------
    // DOCUMENTS
    // -----------------------------------------------------

    documents: [],

    // -----------------------------------------------------
    // LEGACY
    // -----------------------------------------------------

    medicalMemory:
      initialMedicalMemory,

    lastAnalysis: null,

    // -----------------------------------------------------
    // CHAT ACTIONS
    // -----------------------------------------------------

    addMessage:
      (message) =>

        set((state) => ({

          messages: [
            ...state.messages,
            message
          ]
        })),

    updateMessage:
      (id, updates) =>

        set((state) => ({

          messages:
            state.messages.map((m) =>

              m.id === id

                ? {
                  ...m,
                  ...updates
                }

                : m
            )
        })),

    clearHistory:
      () =>

        set({

          messages: [],

          error: null,

          status: null,

          lastAnalysis: null,

          activeCase:
            initialMedicalCase
        }),

    setLoading:
      (
        loading,
        status = null
      ) =>

        set({

          isLoading: loading,

          status
        }),

    setError:
      (error) =>

        set({
          error
        }),

    // -----------------------------------------------------
    // PATIENT ACTIONS
    // -----------------------------------------------------

    setPatientProfile:
      (profile) =>

        set({

          patientProfile: {

            ...profile,

            updatedAt:
              Date.now()
          }
        }),

    updatePatientProfile:
      (updates) =>

        set((state) => ({

          patientProfile: {

            ...(
              state.patientProfile
              || initialPatientProfile
            ),

            ...updates,

            updatedAt:
              Date.now()
          }
        })),

    resetPatientProfile:
      () =>

        set({

          patientProfile:
            initialPatientProfile
        }),

    // -----------------------------------------------------
    // CASE ACTIONS
    // -----------------------------------------------------

    setActiveCase:
      (medicalCase) =>

        set({

          activeCase: {

            ...medicalCase,

            updatedAt:
              Date.now()
          }
        }),

    updateActiveCase:
      (updates) =>

        set((state) => ({

          activeCase: {

            ...(
              state.activeCase
              || initialMedicalCase
            ),

            ...updates,

            updatedAt:
              Date.now()
          }
        })),

    addMedicalCase:
      (medicalCase) =>

        set((state) => ({

          medicalCases: [
            medicalCase,
            ...state.medicalCases
          ]
        })),

    archiveActiveCase:
      () => {

        const currentCase =
          get().activeCase;

        if (!currentCase) {
          return;
        }

        set((state) => ({

          medicalCases: [
            currentCase,
            ...state.medicalCases
          ],

          activeCase: {

            ...initialMedicalCase,

            id:
              `case-${Date.now()}`,

            createdAt:
              Date.now(),

            updatedAt:
              Date.now()
          }
        }));
      },

    resetActiveCase:
      () =>

        set({

          activeCase:
            initialMedicalCase
        }),

    // -----------------------------------------------------
    // DOCUMENTS
    // -----------------------------------------------------

    addDocument:
      (document) =>

        set((state) => ({

          documents: [
            document,
            ...state.documents
          ]
        })),

    removeDocument:
      (id) =>

        set((state) => ({

          documents:
            state.documents.filter(
              doc => doc.id !== id
            )
        })),

    // -----------------------------------------------------
    // LEGACY
    // -----------------------------------------------------

    setMedicalMemory:
      (medicalMemory) =>

        set({
          medicalMemory
        }),

    setLastAnalysis:
      (lastAnalysis) =>

        set({
          lastAnalysis
        })
  }));