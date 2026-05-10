// src/store/useChatStore.ts

import { create } from 'zustand';

import type {
  Message,
  MedicalCase
} from '../types';

interface ChatStore {

  messages: Message[];

  isLoading: boolean;

  status: string | null;

  error: string | null;

  medicalMemory: any;

  lastAnalysis: any;

  medicalCase: MedicalCase | null;

  // -----------------------------------
  // ACTIONS
  // -----------------------------------

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

  setMedicalMemory:
    (memory: any) => void;

  setLastAnalysis:
    (analysis: any) => void;

  setMedicalCase:
    (
      medicalCase: MedicalCase
    ) => void;

  updateMedicalCase:
    (
      updates: Partial<MedicalCase>
    ) => void;

  resetMedicalCase:
    () => void;
}

// -----------------------------------
// INITIAL MEDICAL CASE
// -----------------------------------

const initialMedicalCase:
  MedicalCase = {

  probableCause: '',

  confidence: 'low',

  dangerLevel: 'low',

  symptoms: [],

  detectedTriggers: [],

  excludedConditions: [],

  possibleConditions: [],

  recommendations: [],

  redFlags: [],

  followUpQuestions: [],

  clarificationCount: 0,

  interviewCompleted: false,

  reportGenerated: false,

  createdAt:
    Date.now(),

  updatedAt:
    Date.now()
};

export const useChatStore =
  create<ChatStore>((set) => ({

    // -----------------------------------
    // STATE
    // -----------------------------------

    messages: [],

    isLoading: false,

    status: null,

    error: null,

    lastAnalysis: null,

    medicalCase:
      initialMedicalCase,

    medicalMemory: {

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
    },

    // -----------------------------------
    // ADD MESSAGE
    // -----------------------------------

    addMessage:
      (message) =>

        set((state) => ({

          messages: [
            ...state.messages,
            message
          ]
        })),

    // -----------------------------------
    // UPDATE MESSAGE
    // -----------------------------------

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

    // -----------------------------------
    // CLEAR HISTORY
    // -----------------------------------

    clearHistory:
      () =>

        set({

          messages: [],

          lastAnalysis: null,

          error: null,

          status: null,

          medicalCase:
            initialMedicalCase,

          medicalMemory: {

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
          }
        }),

    // -----------------------------------
    // LOADING
    // -----------------------------------

    setLoading:
      (
        loading,
        status = null
      ) =>

        set({

          isLoading: loading,

          status
        }),

    // -----------------------------------
    // ERROR
    // -----------------------------------

    setError:
      (error) =>

        set({
          error
        }),

    // -----------------------------------
    // MEMORY
    // -----------------------------------

    setMedicalMemory:
      (medicalMemory) =>

        set({
          medicalMemory
        }),

    // -----------------------------------
    // ANALYSIS
    // -----------------------------------

    setLastAnalysis:
      (lastAnalysis) =>

        set({
          lastAnalysis
        }),

    // -----------------------------------
    // SET MEDICAL CASE
    // -----------------------------------

    setMedicalCase:
      (medicalCase) =>

        set({

          medicalCase: {

            ...medicalCase,

            updatedAt:
              Date.now()
          }
        }),

    // -----------------------------------
    // UPDATE MEDICAL CASE
    // -----------------------------------

    updateMedicalCase:
      (updates) =>

        set((state) => ({

          medicalCase: {

            ...(
              state.medicalCase
              || initialMedicalCase
            ),

            ...updates,

            updatedAt:
              Date.now()
          }
        })),

    // -----------------------------------
    // RESET MEDICAL CASE
    // -----------------------------------

    resetMedicalCase:
      () =>

        set({

          medicalCase:
            initialMedicalCase
        })
  }));