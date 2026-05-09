// src/ai/prompts/analysisPrompt.ts
export const ANALYSIS_PROMPT = `
ПРОВЕДИТЕ ПОЛНЫЙ МЕДИЦИНСКИЙ АНАЛИЗ.

СТРУКТУРА ОТВЕТА (JSON):
{
  "summary": "Краткое резюме состояния",
  "probableDiagnoses": ["Список возможных состояний"],
  "risks": ["Факторы риска и красные флаги"],
  "medications": [
    {
      "name": "Название",
      "action": "Как действует",
      "contraindications": ["Противопоказания"]
    }
  ],
  "recommendations": ["Конкретные шаги по обследованию и лечению"],
  "danger_level": "low" | "medium" | "high",
  "suggested_actions": ["К какому врачу пойти, какие анализы сдать"]
}

ИСПОЛЬЗУЙТЕ ВСЕ ДОСТУПНЫЕ ДАННЫЕ ИЗ ПАМЯТИ И ИЗОБРАЖЕНИЙ.
`;
