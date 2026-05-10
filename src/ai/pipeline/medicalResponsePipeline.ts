// src/ai/pipeline/medicalResponsePipeline.ts

// Этот файл отвечает за:
// - генерацию ответа AI,
// - нормализацию,
// - anti-repeat validation,
// - создание snapshot.
//
// Главная цель:
// убрать response logic
// из orchestrator.

import { OpenAIProvider }
  from "../providers/openaiProvider.js";

import { ResponseMode }
  from "../types/index.js";

import {
  normalizeMedicalResponse
} from "../normalization/normalizeMedicalResponse.js";

import {
  validateGeneratedQuestion
} from "../interview/validateGeneratedQuestion.js";

export class MedicalResponsePipeline {

  private provider:
    OpenAIProvider;

  constructor(apiKey: string) {

    this.provider =
      new OpenAIProvider(apiKey);
  }

  async generateResponse({

    model,

    systemInstruction,

    history,

    userInput,

    imageParts,

    decision,

    diagnosticState,

    interviewState,

    medicalStateUpdates

  }: any) {

    // -----------------------------------
    // GENERATE
    // -----------------------------------

    const response =

      await this.provider
        .generateText({

          model,

          systemInstruction,

          history,

          userInput,

          imageParts
        });

    // -----------------------------------
    // NORMALIZE
    // -----------------------------------

    const normalizedResponse =

      normalizeMedicalResponse(
        response,
        decision
      );

    // -----------------------------------
    // VALIDATE
    // -----------------------------------

    if (

      decision.mode ===
      ResponseMode.CLARIFICATION_MODE

      &&

      !normalizedResponse
        .interviewCompleted

    ) {

      const validation =

        validateGeneratedQuestion(

          normalizedResponse.summary,

          diagnosticState
            .alreadyCovered
        );

      if (!validation.valid) {

        normalizedResponse.summary =
          "Наиболее вероятно речь идет о нетяжелой проблеме. Если симптомы усиливаются или появляются тревожные признаки — обратитесь к врачу.";

        normalizedResponse
          .interviewCompleted =
            true;

        normalizedResponse
          .quickReplies = [];
      }
    }

    // -----------------------------------
    // SNAPSHOT
    // -----------------------------------

    const snapshot = {

      ...normalizedResponse,

      confidence:
        interviewState.confidence,

      timestamp:
        Date.now(),

      medicalStateUpdates
    };

    return {

      normalizedResponse,

      snapshot
    };
  }
}