// src/hooks/useMedicalAI.ts

import { useCallback } from 'react';

import { nanoid } from 'nanoid';

import { useChatStore }
  from '../store/useChatStore';

import { apiService }
  from '../services/apiService';

import type {
  Message,
  AIResponse
} from '../types';

export const useMedicalAI = () => {

  const {

    messages,

    medicalMemory,

    lastAnalysis,

    addMessage,

    setLoading,

    setError,

    setMedicalMemory,

    setPatientProfile,

    setLastAnalysis

  } = useChatStore();

  const processResponse = useCallback(

    async (
      text: string,
      image?: string
    ) => {

      try {

        setLoading(
          true,
          'Анализирую...'
        );

        // -----------------------------------
        // USER MESSAGE
        // -----------------------------------

        const userMessage: Message = {

          id: nanoid(),

          role: 'user',

          content: text,

          timestamp: Date.now()
        };

        addMessage(userMessage);

        // -----------------------------------
        // API REQUEST
        // -----------------------------------

        const response =

          await apiService.chat(

            [

              ...messages,

              userMessage
            ],

            medicalMemory
              ?.patientProfile,

            null,

            lastAnalysis
          );

        // -----------------------------------
        // SAVE MEMORY
        // -----------------------------------

        if (
          response.updatedMemory
        ) {

          // -----------------------------------
          // UPDATE FULL MEMORY
          // -----------------------------------

          setMedicalMemory(
            response.updatedMemory
          );

          // -----------------------------------
          // FORCE SYNC PROFILE
          // -----------------------------------

          if (
            response.updatedMemory
              ?.patientProfile
          ) {

            setPatientProfile(
              response.updatedMemory
                .patientProfile
            );
          }

          console.log(
            'UPDATED MEMORY:',
            response.updatedMemory
          );

          console.log(
            'UPDATED PROFILE:',
            response.updatedMemory
              ?.patientProfile
          );
        }

        // -----------------------------------
        // SAVE ANALYSIS
        // -----------------------------------

        if (
          response.lastAnalysis
        ) {

          setLastAnalysis(
            response.lastAnalysis
          );
        }

        // -----------------------------------
        // AI DATA
        // -----------------------------------

        const aiData: AIResponse = {

          summary:
            response.text,

          possible_risks: [],

          recommendations: [],

          danger_level:
            response
              ?.decision
              ?.emergencyLevel

            ||

            'low',

          suggested_actions: [],

          medical_warning:
            'Это предварительный анализ ИИ.',

          quick_replies:
            response.quickReplies || []
        };
        // -----------------------------------
        // ASSISTANT MESSAGE
        // -----------------------------------

        const assistantMessage: Message = {

          id: nanoid(),

          role: 'assistant',

          content:
            response.text,

          timestamp:
            Date.now(),

          ai_data:
            aiData
        };

        addMessage(
          assistantMessage
        );

      } catch (err: any) {

        console.error(err);

        setError(

          err?.message

          ||

          'Ошибка связи с AI'
        );

      } finally {

        setLoading(false);
      }
    },

    [

      messages,

      medicalMemory,

      lastAnalysis,

      addMessage,

      setLoading,

      setError,

      setMedicalMemory,

      setLastAnalysis
    ]
  );

  return {
    processResponse
  };
};