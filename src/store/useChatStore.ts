// src/store/useChatStore.ts

import { create } from 'zustand';

import { persist } from 'zustand/middleware';

import {
  ChatState
} from '../types';

export const useChatStore = create<ChatState>()(

  persist(

    (set) => ({

      // -------------------------
      // CHAT
      // -------------------------

      messages: [],

      // -------------------------
      // MEDICAL MEMORY
      // -------------------------

      medicalMemory: {

        symptoms: [],

        medications: [],

        diagnoses: [],

        allergies: [],

        riskFactors: [],

        uploadedDocuments: [],

        extractedFacts: []
      },

      // -------------------------
      // ANALYSIS
      // -------------------------

      lastAnalysis: null,

      // -------------------------
      // INTERVIEW FLOW
      // -------------------------

      interviewState: {

        active: false,

        currentStep: 1,

        totalSteps: 1,

        currentQuestion: '',

        collectedAnswers: []
      },

      // -------------------------
      // UI
      // -------------------------

      isLoading: false,

      status: null,

      error: null,

      // -------------------------
      // CHAT ACTIONS
      // -------------------------

      addMessage: (message) =>

        set((state) => ({
          messages: [
            ...state.messages,
            message
          ]
        })),

      updateMessage: (id, updates) =>

        set((state) => ({

          messages:
            state.messages.map((m) =>

              m.id === id
                ? {
                    ...m,
                    ...updates
                  }
                : m
            ),
        })),

      // -------------------------
      // LOADING
      // -------------------------

      setLoading: (
        loading,
        status = null
      ) =>

        set({
          isLoading: loading,
          status
        }),

      // -------------------------
      // MEMORY
      // -------------------------

      setMedicalMemory: (memory) =>

        set((state) => ({

          medicalMemory: {

            ...state.medicalMemory,

            ...memory
          }
        })),

      // -------------------------
      // ANALYSIS
      // -------------------------

      setLastAnalysis: (analysis) =>

        set({
          lastAnalysis: analysis
        }),

      // -------------------------
      // INTERVIEW FLOW
      // -------------------------

      setInterviewState: (updates) =>

        set((state) => ({

          interviewState: {

            ...state.interviewState,

            ...updates
          }
        })),

      resetInterview: () =>

        set({

          interviewState: {

            active: false,

            currentStep: 1,

            totalSteps: 1,

            currentQuestion: '',

            collectedAnswers: []
          }
        }),

      // -------------------------
      // ERROR
      // -------------------------

      setError: (error) =>

        set({
          error
        }),

      // -------------------------
      // CLEAR
      // -------------------------

      clearHistory: () =>

        set({

          messages: [],

          medicalMemory: {

            symptoms: [],

            medications: [],

            diagnoses: [],

            allergies: [],

            riskFactors: [],

            uploadedDocuments: [],

            extractedFacts: []
          },

          lastAnalysis: null,

          interviewState: {

            active: false,

            currentStep: 1,

            totalSteps: 1,

            currentQuestion: '',

            collectedAnswers: []
          },

          isLoading: false,

          status: null,

          error: null
        }),
    }),

    {
      name: 'medical-ai-chat-history',
    }
  )
);