// src/store/useChatStore.ts

import { create } from 'zustand';

import type {
  Message
} from '../types';

interface ChatStore {

  messages: Message[];

  isLoading: boolean;

  status: string | null;

  error: string | null;

  medicalMemory: any;

  lastAnalysis: any;

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
}

export const useChatStore =
  create<ChatStore>((set) => ({

    // -----------------------------------
    // STATE
    // -----------------------------------

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
        })
  }));