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

        completed: false,

        currentStep: 0,

        totalSteps: 0,

        currentQuestion: '',

        collectedAnswers: [],

        skippedQuestions: [],

        askedQuestions: []
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
          ].slice(-40)
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

        set((state) => {

          const current =
            state.interviewState;

          return {

            interviewState: {

              ...current,

              ...updates,

              askedQuestions: [

                ...new Set([

                  ...(current.askedQuestions || []),

                  ...(updates.askedQuestions || [])
                ])
              ],

              skippedQuestions: [

                ...new Set([

                  ...(current.skippedQuestions || []),

                  ...(updates.skippedQuestions || [])
                ])
              ],

              collectedAnswers: [

                ...(current.collectedAnswers || []),

                ...(updates.collectedAnswers || [])
              ]
            }
          };
        }),

      resetInterview: () =>

        set({

          interviewState: {

            active: false,

            completed: false,

            currentStep: 0,

            totalSteps: 0,

            currentQuestion: '',

            collectedAnswers: [],

            skippedQuestions: [],

            askedQuestions: []
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

            completed: false,

            currentStep: 0,

            totalSteps: 0,

            currentQuestion: '',

            collectedAnswers: [],

            skippedQuestions: [],

            askedQuestions: []
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