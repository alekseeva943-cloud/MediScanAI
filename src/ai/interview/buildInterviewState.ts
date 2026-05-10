// src/ai/interview/buildInterviewState.ts

// Этот файл отвечает за создание состояния медицинского интервью.
// Здесь AI определяет:
// - сколько уже было уточнений,
// - какие вопросы уже задавались,
// - насколько уверенно выглядит сценарий,
// - пора ли завершать интервью.

import type { MedicalMemory } from "../types/index.js";

export interface InterviewState {

  clarificationCount: number;

  previousQuestions: string[];

  confidence:
    | "low"
    | "medium"
    | "high";

  shouldFinishInterview: boolean;

  obviousFoodIrritation: boolean;

  probableFishScratch: boolean;
}

export function buildInterviewState(
  history: any[],
  memory: MedicalMemory
): InterviewState {

  const assistantMessages =
    history.filter(
      (m) => m.role === "assistant"
    );

  const clarificationCount =
    assistantMessages.length;

  const previousQuestions =
    assistantMessages
      .map((m) => {

        try {

          const parsed =
            JSON.parse(m.content);

          return parsed?.text || "";

        } catch {

          return m.content || "";
        }

      })
      .filter(Boolean)
      .slice(-12);

  const extractedFacts =
    memory.extractedFacts || [];

  const joinedFacts =
    extractedFacts
      .join(" ")
      .toLowerCase();

  const obviousFoodIrritation =

    (
      joinedFacts.includes("остр")
      ||
      joinedFacts.includes("халапеньо")
      ||
      joinedFacts.includes("шаурм")
    )

    &&

    (
      joinedFacts.includes("жжение")
      ||
      joinedFacts.includes("зуд")
    )

    &&

    !joinedFacts.includes("кров")
    &&
    !joinedFacts.includes("температ")
    &&
    !joinedFacts.includes("рвот")
    &&
    !joinedFacts.includes("сильная боль");

  const probableFishScratch =

    (
      joinedFacts.includes("косточ")
      ||
      joinedFacts.includes("рыб")
    )

    &&

    (
      joinedFacts.includes("глот")
      ||
      joinedFacts.includes("горл")
    )

    &&

    !joinedFacts.includes("удуш")
    &&
    !joinedFacts.includes("не могу дышать")
    &&
    !joinedFacts.includes("кров")
    &&
    !joinedFacts.includes("температ");

  let confidence:
    | "low"
    | "medium"
    | "high" = "low";

  if (
    obviousFoodIrritation
    ||
    probableFishScratch
  ) {

    confidence = "high";

  } else if (
    extractedFacts.length >= 4
  ) {

    confidence = "medium";
  }

  const shouldFinishInterview =

    confidence === "high"

    ||

    clarificationCount >= 6;

  return {

    clarificationCount,

    previousQuestions,

    confidence,

    shouldFinishInterview,

    obviousFoodIrritation,

    probableFishScratch
  };
}