import { Message, AIResponse } from '../types';

import { MEDICAL_SYSTEM_PROMPT } from './medicalPrompt';

export interface ChatApiResponse {
  text: string;

  decision: any;

  updatedMemory?: any;

  lastAnalysis?: any;

  quickReplies?: string[];
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

    let quickReplies: string[] = [];

    if (
      data?.decision?.mode === 'CLARIFICATION_MODE'
    ) {

      const text =
        String(data.text || '').toLowerCase();

      if (
        text.includes('когда')
      ) {

        quickReplies = [
          'Сегодня',
          'Вчера',
          'Несколько дней',
          'Давно',
          'Пропустить'
        ];
      }

      else if (

        text.includes('боль')

        ||

        text.includes('болит')

      ) {

        quickReplies = [
          'Слабая',
          'Средняя',
          'Сильная',
          'Только при движении',
          'Пропустить'
        ];
      }

      else if (
        text.includes('температур')
      ) {

        quickReplies = [
          'Нет',
          '37-38',
          '38+',
          'Не измерял',
          'Пропустить'
        ];
      }

      else if (

        text.includes('отек')

        ||

        text.includes('опух')

      ) {

        quickReplies = [
          'Да',
          'Нет',
          'Немного',
          'Сильный',
          'Пропустить'
        ];
      }

      else if (

        text.includes('травм')

        ||

        text.includes('удар')

        ||

        text.includes('падени')

      ) {

        quickReplies = [
          'Да',
          'Нет',
          'После спорта',
          'После падения',
          'Пропустить'
        ];
      }

      else {

        quickReplies = [
          'Да',
          'Нет',
          'Не знаю',
          'Пропустить'
        ];
      }
    }

    return {

      text: data.text,

      decision: data.decision,

      updatedMemory: data.updatedMemory,

      lastAnalysis: data.lastAnalysis,

      quickReplies
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