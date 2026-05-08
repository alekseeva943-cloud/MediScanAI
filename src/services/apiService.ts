import { Message, AIResponse } from '../types';
import { MEDICAL_SYSTEM_PROMPT } from './medicalPrompt';

export const apiService = {
  async chat(messages: { role: string; content: any }[]): Promise<AIResponse> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: MEDICAL_SYSTEM_PROMPT,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка API');
    }

    return response.json();
  },

  async transcribeVoice(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice.webm');

    const response = await fetch('/api/voice', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка транскрипции');
    }

    const data = await response.json();
    return data.text;
  }
};
