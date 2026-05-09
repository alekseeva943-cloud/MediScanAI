// src/hooks/useMedicalAI.ts
import { useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { MedicalOrchestrator } from '../ai/orchestration/medicalOrchestrator';
import { Message, AIResponse } from '../types';
import { nanoid } from 'nanoid';
import { ResponseMode } from '../ai/types';

export const useMedicalAI = () => {
  const { 
    messages, 
    medicalMemory, 
    lastAnalysis, 
    addMessage, 
    updateMessage, 
    setLoading, 
    setError,
    setMedicalMemory,
    setLastAnalysis
  } = useChatStore();

  const processResponse = useCallback(async (text: string, image?: string) => {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || ''; // Fallback or handle correctly
    const orchestrator = new MedicalOrchestrator(apiKey);

    const imageParts: any[] = [];
    if (image) {
      const base64Data = image.split(',')[1];
      imageParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }

    try {
      setLoading(true, 'Анализирую...');
      
      const { text: aiText, decision } = await orchestrator.processRequest(
        text,
        imageParts,
        messages,
        medicalMemory,
        lastAnalysis
      );

      let aiData: AIResponse;
      
      if (decision.mode === ResponseMode.FULL_MEDICAL_ANALYSIS) {
        try {
          const parsed = JSON.parse(aiText.replace(/```json|```/g, ""));
          aiData = {
            summary: parsed.summary,
            possible_risks: parsed.risks,
            recommendations: parsed.recommendations,
            danger_level: parsed.danger_level,
            suggested_actions: parsed.suggested_actions,
            medical_warning: "Это предварительный анализ ИИ. Обратитесь к врачу.",
            is_analysis_needed: false
          };
          
          setLastAnalysis({
            timestamp: Date.now(),
            summary: parsed.summary,
            probableDiagnoses: parsed.probableDiagnoses,
            risks: parsed.risks,
            medications: parsed.medications,
            recommendations: parsed.recommendations
          });
        } catch (e) {
          aiData = {
            summary: aiText,
            possible_risks: [],
            recommendations: [],
            danger_level: 'low',
            suggested_actions: [],
            medical_warning: "Ошибка разбора анализа.",
            is_analysis_needed: true
          };
        }
      } else {
        aiData = {
          summary: aiText,
          possible_risks: [],
          recommendations: [],
          danger_level: 'low',
          suggested_actions: [],
          medical_warning: "Это ИИ ассистент.",
          is_analysis_needed: decision.mode === ResponseMode.CLARIFICATION_MODE
        };
      }

      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: aiData.summary,
        timestamp: Date.now(),
        ai_data: aiData,
      };

      addMessage(assistantMessage);
      
      // Update memory if needed (this would ideally be another AI pass or extracted during the conversation)
      // For now, let's just mark that we processed the request.

    } catch (err: any) {
      setError(err.message || 'Ошибка связи с ИИ');
    } finally {
      setLoading(false);
    }
  }, [messages, medicalMemory, lastAnalysis, addMessage, setLoading, setError, setLastAnalysis]);

  return { processResponse };
};
