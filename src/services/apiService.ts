
// src/services/apiService.ts

import type {

  MedicalCase,

  PatientProfile

} from '../types';

// -----------------------------------------------------
// RESPONSE
// -----------------------------------------------------

export interface ChatApiResponse {

  text: string;

  decision: any;

  updatedMemory?: any;

  lastAnalysis?: any;

  quickReplies?: string[];

  interviewCompleted?: boolean;
}

// -----------------------------------------------------
// API
// -----------------------------------------------------

export const apiService = {

  // -----------------------------------------------------
  // CHAT
  // -----------------------------------------------------

  async chat(

    messages: {

      role: string;

      content: any;

    }[],

    patientProfile?: PatientProfile | null,

    activeCase?: MedicalCase | null,

    lastAnalysis?: any

  ): Promise<ChatApiResponse> {

    const reducedMessages =
  messages.slice(-4);

console.log(
  "SENDING MEMORY:",
  patientProfile
);

const response =
  await fetch('/api/chat', {

    method: 'POST',

    headers: {

      'Content-Type':
        'application/json'
    },

      body: JSON.stringify({

        messages:
          reducedMessages,

        patientProfile,

        activeCase,

        lastAnalysis
      })
    });

    // -----------------------------------------------------
    // ERROR
    // -----------------------------------------------------

    if (!response.ok) {

      const error =
        await response.json();

      throw new Error(

        error.error ||

        'Ошибка API'
      );
    }

    // -----------------------------------------------------
    // DATA
    // -----------------------------------------------------

    const data =
      await response.json();

    return {

      text:
        data.text || "",

      decision:
        data.decision || {},

      updatedMemory:
        data.updatedMemory || null,

      lastAnalysis:
        data.lastAnalysis || null,

      quickReplies:

        Array.isArray(
          data.quickReplies
        )

          ? data.quickReplies

          : [],

      interviewCompleted:

        data.interviewCompleted || false
    };
  },

  // -----------------------------------------------------
  // VOICE
  // -----------------------------------------------------

  async transcribeVoice(
    audioBlob: Blob
  ): Promise<string> {

    const formData =
      new FormData();

    formData.append(

      'file',

      audioBlob,

      'voice.webm'
    );

    const response =
      await fetch('/api/voice', {

        method: 'POST',

        body: formData
      });

    if (!response.ok) {

      const error =
        await response.json();

      throw new Error(

        error.error ||

        'Ошибка транскрипции'
      );
    }

    const data =
      await response.json();

    return data.text;
  }
};
