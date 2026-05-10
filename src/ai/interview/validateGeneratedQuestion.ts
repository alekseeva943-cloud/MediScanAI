// src/ai/interview/validateGeneratedQuestion.ts

// Проверка AI вопроса.
//
// Этот слой нужен чтобы:
//
// - блокировать циклы
// - блокировать повторные вопросы
// - блокировать перефразированные повторы
//
// ВАЖНО:
//
// Это НЕ medical logic.
//
// Это только anti-loop protection.

import {
  classifyQuestionTopic
} from "./questionTopics.js";

export interface QuestionValidationResult {

  valid: boolean;

  reason?: string;

  topic: string;
}

function normalizeQuestion(
  question: string
): string {

  return question
    .toLowerCase()
    .trim()
    .replace(/[?.!,]/g, "");
}

export function validateGeneratedQuestion(
  question: string,
  alreadyCoveredTopics: string[]
): QuestionValidationResult {

  const normalizedQuestion =
    normalizeQuestion(question);

  const topic =
    classifyQuestionTopic(
      normalizedQuestion
    );

  // -----------------------------------
  // DIRECT TOPIC REPEAT
  // -----------------------------------

  if (

    topic !== "unknown"

    &&

    alreadyCoveredTopics.includes(
      topic
    )

  ) {

    return {

      valid: false,

      topic,

      reason:
        `Repeated topic: ${topic}`
    };
  }

  // -----------------------------------
  // SEMANTIC REPEATS
  // -----------------------------------

  const repeatPatterns = [

    // pain character

    "какой характер боли",
    "боль острая",
    "боль тупая",
    "боль жгучая",

    // pain location

    "где болит",
    "где именно болит",

    // swelling

    "есть ли отек",
    "имеется ли отек",

    // numbness

    "есть ли онемение",

    // trauma

    "была ли травма",
    "ударялись ли",

    // duration

    "как долго",
    "когда началось"
  ];

  const matchedRepeat =

    repeatPatterns.find(pattern =>

      normalizedQuestion.includes(
        pattern
      )
    );

  if (matchedRepeat) {

    const repeatedTopic =
      classifyQuestionTopic(
        matchedRepeat
      );

    if (

      alreadyCoveredTopics.includes(
        repeatedTopic
      )

    ) {

      return {

        valid: false,

        topic: repeatedTopic,

        reason:
          `Semantic repeat: ${repeatedTopic}`
      };
    }
  }

  return {

    valid: true,

    topic
  };
}