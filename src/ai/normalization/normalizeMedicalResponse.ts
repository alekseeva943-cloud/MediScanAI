// src/ai/normalization/normalizeMedicalResponse.ts

// Этот файл отвечает за:
// - безопасный parse JSON ответа AI,
// - очистку markdown,
// - защиту от кривого JSON,
// - нормализацию структуры ответа,
// - установку fallback значений.
//
// Это защищает orchestrator от:
// - malformed JSON,
// - неполных ответов,
// - отсутствующих полей.

import type {
  RouterDecision
} from "../types/index.js";

interface NormalizedMedicalResponse {

  summary: string;

  probableDiagnoses: string[];

  reasoning: string[];

  risks: string[];

  recommendations: string[];

  medications: string[];

  suggested_actions: string[];

  quickReplies: string[];

  danger_level: string;

  interviewCompleted: boolean;
}

function safeJsonParse(
  text: string
): any | null {

  try {

    const cleaned = text

      .replace(/```json/g, "")

      .replace(/```/g, "")

      .trim();

    return JSON.parse(cleaned);

  } catch {

    return null;
  }
}

export function normalizeMedicalResponse(
  response: string,
  decision: RouterDecision
): NormalizedMedicalResponse {

  const parsed =
    safeJsonParse(response);

  return {

    summary:

      parsed?.summary

      ||

      parsed?.message

      ||

      response,

    probableDiagnoses:

      Array.isArray(
        parsed?.probableDiagnoses
      )

        ? parsed.probableDiagnoses

        : [],

    reasoning:

      Array.isArray(
        parsed?.reasoning
      )

        ? parsed.reasoning

        : [],

    risks:

      Array.isArray(
        parsed?.risks
      )

        ? parsed.risks

        : [],

    recommendations:

      Array.isArray(
        parsed?.recommendations
      )

        ? parsed.recommendations

        : [],

    medications:

      Array.isArray(
        parsed?.medications
      )

        ? parsed.medications

        : [],

    suggested_actions:

      Array.isArray(
        parsed?.suggested_actions
      )

        ? parsed.suggested_actions

        : [],

    quickReplies:

      Array.isArray(
        parsed?.quick_replies
      )

        ? parsed.quick_replies

        : [],

    danger_level:

      parsed?.danger_level

      ||

      decision?.emergencyLevel

      ||

      "low",

    interviewCompleted:

      parsed?.interviewCompleted

      ||

      decision?.interviewCompleted

      ||

      false
  };
}