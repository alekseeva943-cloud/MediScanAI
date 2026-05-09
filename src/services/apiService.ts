// src/services/apiService.ts

import { Message, AIResponse } from '../types';

import { MEDICAL_SYSTEM_PROMPT } from './medicalPrompt';

export interface ChatApiResponse {
  text: string;

  decision: any;

  updatedMemory?: any;

  lastAnalysis?: any;
}

export const apiService = {

  async chat(
    messages: {
      role: string;
      content: any;
    }[],

    memory?: any,

    lastAnalysis?: any

  ): Promise<ChatApiResponse> {

    const response = await fetch('/api/chat', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        messages,
        memory,
        lastAnalysis
      }),
    });

    if (!response.ok) {

      const error = await response.json();

      throw new Error(
        error.error || 'Ошибка API'
      );
    }

    const data = await response.json();

    return {
      text: data.text,

      decision: data.decision,

      updatedMemory: data.updatedMemory,

      lastAnalysis: data.lastAnalysis
    };
  },

  async transcribeVoice(
    audioBlob: Blob
  ): Promise<string> {

    const formData = new FormData();

    formData.append(
      'file',
      audioBlob,
      'voice.webm'
    );

    const response = await fetch('/api/voice', {

      method: 'POST',

      body: formData,
    });

    if (!response.ok) {

      const error = await response.json();

      throw new Error(
        error.error || 'Ошибка транскрипции'
      );
    }

    const data = await response.json();

    return data.text;
  }
};