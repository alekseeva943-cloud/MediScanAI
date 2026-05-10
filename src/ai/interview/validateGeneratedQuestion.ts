// src/ai/interview/validateGeneratedQuestion.ts

// Этот файл отвечает за проверку
// вопроса, который сгенерировал AI.
//
// Главная задача:
//
// НЕ дать AI:
// - повторять вопросы,
// - спрашивать одно и то же,
// - зацикливаться,
// - задавать useless questions.
//
// Это post-generation validation layer.

import {
  classifyQuestionTopic
} from "./questionTopics.js";

export interface QuestionValidationResult {

  valid: boolean;

  reason?: string;

  topic: string;
}

export function validateGeneratedQuestion(
  question: string,
  alreadyCoveredTopics: string[]
): QuestionValidationResult {

  const topic =
    classifyQuestionTopic(question);

  // -----------------------------------
  // UNKNOWN
  // -----------------------------------

  if (
    topic === "unknown"
  ) {

    return {

      valid: true,

      topic
    };
  }

  // -----------------------------------
  // REPEAT DETECTION
  // -----------------------------------

  if (
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

  return {

    valid: true,

    topic
  };
}