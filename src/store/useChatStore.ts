// src/store/useChatStore.ts

import { create } from 'zustand';

import type {
  Message
} from '../types';

interface MedicalInterviewState {

  mainComplaint: string;

  currentSymptoms: string[];

  confirmedSymptoms: string[];

  deniedSymptoms: string[];

  possibleTriggers: string[];

  excludedConditions: string[];

  askedQuestions: string[];

  answeredFacts: string[];

  currentHypotheses: string[];

  timeline: string[];

  interviewCompleted: boolean;
}

interface ChatStore {

  messages: Message[];

  isLoading: boolean;

  status: string | null;

  error: string | null;

  medicalMemory: any;

  lastAnalysis: any;

  medicalInterviewState:
    MedicalInterviewState;

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

  updateInterviewState:
    (
      updates: Partial<MedicalInterviewState>
    ) => void;

  addAskedQuestion:
    (question: string) => void;

  addConfirmedSymptom:
    (symptom: string) => void;

  addDeniedSymptom:
    (symptom: string) => void;

  addPossibleTrigger:
    (trigger: string) => void;

  addAnsweredFact:
    (fact: string) => void;

  resetInterviewState:
    () => void;
}

const initialInterviewState:
  MedicalInterviewState = {

  mainComplaint: '',

  currentSymptoms: [],

  confirmedSymptoms: [],

  deniedSymptoms: [],

  possibleTriggers: [],

  excludedConditions: [],

  askedQuestions: [],

  answeredFacts: [],

  currentHypotheses: [],

  timeline: [],

  interviewCompleted: false
};

export const useChatStore =
  create<ChatStore>((set) => ({

    messages: [],

    isLoading: false,

    status: null,

    error: null,

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

    lastAnalysis: null,

    medicalInterviewState:
      initialInterviewState,

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

          lastAnalysis: null,

          error: null,

          status: null,

          medicalInterviewState:
            initialInterviewState,

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

    setMedicalMemory:
      (medicalMemory) =>

        set({
          medicalMemory
        }),

    setLastAnalysis:
      (lastAnalysis) =>

        set({
          lastAnalysis
        }),

    updateInterviewState:
      (updates) =>

        set((state) => ({

          medicalInterviewState: {

            ...state.medicalInterviewState,

            ...updates
          }
        })),

    addAskedQuestion:
      (question) =>

        set((state) => ({

          medicalInterviewState: {

            ...state.medicalInterviewState,

            askedQuestions: [

              ...new Set([
                ...state
                  .medicalInterviewState
                  .askedQuestions,

                question
              ])
            ]
          }
        })),

    addConfirmedSymptom:
      (symptom) =>

        set((state) => ({

          medicalInterviewState: {

            ...state.medicalInterviewState,

            confirmedSymptoms: [

              ...new Set([
                ...state
                  .medicalInterviewState
                  .confirmedSymptoms,

                symptom
              ])
            ]
          }
        })),

    addDeniedSymptom:
      (symptom) =>

        set((state) => ({

          medicalInterviewState: {

            ...state.medicalInterviewState,

            deniedSymptoms: [

              ...new Set([
                ...state
                  .medicalInterviewState
                  .deniedSymptoms,

                symptom
              ])
            ]
          }
        })),

    addPossibleTrigger:
      (trigger) =>

        set((state) => ({

          medicalInterviewState: {

            ...state.medicalInterviewState,

            possibleTriggers: [

              ...new Set([
                ...state
                  .medicalInterviewState
                  .possibleTriggers,

                trigger
              ])
            ]
          }
        })),

    addAnsweredFact:
      (fact) =>

        set((state) => ({

          medicalInterviewState: {

            ...state.medicalInterviewState,

            answeredFacts: [

              ...new Set([
                ...state
                  .medicalInterviewState
                  .answeredFacts,

                fact
              ])
            ]
          }
        })),

    resetInterviewState:
      () =>

        set({

          medicalInterviewState:
            initialInterviewState
        })
  }));