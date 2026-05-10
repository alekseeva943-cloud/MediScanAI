// src/ai/orchestration/medicalOrchestrator.ts

import { OpenAIProvider } from "../providers/openaiProvider.js";

import { MedicalRouter } from "../router/medicalRouter.js";

import { MedicalStateUpdater } from "./medicalStateUpdater.js";

import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

import { ANALYSIS_PROMPT } from "../prompts/analysisPrompt.js";

import { UPDATE_ANALYSIS_PROMPT } from "../prompts/updateAnalysisPrompt.js";

import { MEMORY_EXTRACTION_PROMPT } from "../prompts/memoryExtractionPrompt.js";

import { ResponseMode } from "../types/index.js";

import type {

  MedicalMemory,

  AnalysisSnapshot,

  RouterDecision,

  AIMedicalUpdateResult

} from "../types/index.js";

import {
  buildClarificationPrompt
} from "../prompts/buildClarificationPrompt.js";

import {
  buildDiagnosticState
} from "../interview/buildDiagnosticState.js";

import {
  buildInterviewState
} from "../interview/buildInterviewState.js";

import {
  normalizeMedicalResponse
} from "../normalization/normalizeMedicalResponse.js";

import {
  mergeMedicalMemory
} from "../memory/mergeMedicalMemory.js";

import {
  validateGeneratedQuestion
} from "../interview/validateGeneratedQuestion.js";

export class MedicalOrchestrator {

  private provider: OpenAIProvider;

  private router: MedicalRouter;

  private stateUpdater: MedicalStateUpdater;

  constructor(apiKey?: string) {

    const key =
      apiKey ||
      process.env.OPENAI_API_KEY ||
      "";

    this.provider =
      new OpenAIProvider(key);

    this.router =
      new MedicalRouter(key);

    this.stateUpdater =
      new MedicalStateUpdater(key);
  }

  // -----------------------------------
  // COMPACT MEMORY
  // -----------------------------------

  private buildCompactMemory(
    memory: MedicalMemory
  ) {

    return {

      symptoms:
        memory.symptoms.slice(-15),

      medications:
        memory.medications.slice(-10),

      diagnoses:
        memory.diagnoses.slice(-10),

      allergies:
        memory.allergies.slice(-10),

      riskFactors:
        memory.riskFactors.slice(-10),

      extractedFacts:
        memory.extractedFacts.slice(-20),

      chronicConditions:
        (memory.chronicConditions || [])
          .slice(-10),

      surgeries:
        (memory.surgeries || [])
          .slice(-10),

      familyHistory:
        (memory.familyHistory || [])
          .slice(-10),

      age:
        memory.age,

      sex:
        memory.sex
    };
  }

  // -----------------------------------
  // MEMORY EXTRACTION
  // -----------------------------------

  private async extractMemory(
    userInput: string,
    memory: MedicalMemory
  ): Promise<Partial<MedicalMemory>> {

    try {

      const compactMemory =
        this.buildCompactMemory(memory);

      const prompt = `
${MEMORY_EXTRACTION_PROMPT}

CURRENT MEMORY:
${JSON.stringify(compactMemory)}

NEW USER MESSAGE:
${userInput.slice(0, 4000)}
`;

      const text =
        await this.provider.generateRouterDecision(
          prompt
        );

      const cleaned = text

        .replace(/```json/g, "")

        .replace(/```/g, "")

        .trim();

      return JSON.parse(cleaned);

    } catch (error) {

      console.error(
        "Memory extraction error:",
        error
      );

      return {};
    }
  }

  // -----------------------------------
  // MAIN PROCESS
  // -----------------------------------

  async processRequest(
    userInput: string,
    imageParts: any[],
    history: any[],
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ) {

    const safeUserInput =
      userInput.slice(0, 6000);

    const safeHistory =
      history.slice(-10);

    // -----------------------------------
    // AI STATE UPDATE
    // -----------------------------------

    let medicalStateUpdates:
      AIMedicalUpdateResult = {};

    try {

      medicalStateUpdates =

        await this.stateUpdater
          .updateMedicalState(

            safeUserInput,

            memory,

            lastAnalysis
          );

      console.log(
        "Medical state updates:",
        medicalStateUpdates
      );

    } catch (error) {

      console.error(
        "Medical updater failed:",
        error
      );
    }

    // -----------------------------------
    // INTERVIEW STATE
    // -----------------------------------

    const interviewState =
      buildInterviewState(
        safeHistory,
        memory
      );

    // -----------------------------------
    // ROUTER
    // -----------------------------------

    const decision: RouterDecision =
      await this.router.decide(
        safeUserInput,
        safeHistory,
        memory,
        lastAnalysis
      );

    console.log(
      "Orchestrator decision:",
      decision
    );

    console.log(
      "Interview state:",
      interviewState
    );

    // -----------------------------------
    // FORCE FINISH
    // -----------------------------------

    if (

      decision.mode ===
      ResponseMode.CLARIFICATION_MODE

      &&

      interviewState.shouldFinishInterview

    ) {

      decision.mode =
        ResponseMode.FULL_MEDICAL_ANALYSIS;

      decision.interviewCompleted =
        true;
    }

    // -----------------------------------
    // MEMORY EXTRACTION
    // -----------------------------------

    const extractedMemory =
      await this.extractMemory(
        safeUserInput,
        memory
      );

    // -----------------------------------
    // UPDATE MEMORY
    // -----------------------------------

    const updatedMemory =
      mergeMedicalMemory(
        memory,
        extractedMemory
      );

    // -----------------------------------
    // DIAGNOSTIC STATE
    // -----------------------------------

    const diagnosticState =
      buildDiagnosticState(
        updatedMemory,
        interviewState
      );


    // -----------------------------------
    // SYSTEM PROMPT
    // -----------------------------------

    let systemInstruction =
      SYSTEM_PROMPT;

    let modelName:
      "gpt-4o-mini" |
      "gpt-4.1-mini" =
      "gpt-4o-mini";

    switch (decision.mode) {

      case ResponseMode.FULL_MEDICAL_ANALYSIS:

        systemInstruction +=
          "\n" + ANALYSIS_PROMPT;

        modelName =
          "gpt-4.1-mini";

        systemInstruction += `

IMPORTANT:

- Stop asking questions.
- The interview is already sufficient.
- Give a concise medical assessment.
- Explain the MOST LIKELY cause.
- Give practical recommendations.
- Mention red flags ONLY if relevant.
- Behave like an experienced doctor.

IMPORTANT:
Do NOT continue the interview.
`;

        break;

      case ResponseMode.ANALYSIS_UPDATE_MODE:

        systemInstruction +=
          "\n" + UPDATE_ANALYSIS_PROMPT;

        break;

      case ResponseMode.CLARIFICATION_MODE:

        systemInstruction +=
          buildClarificationPrompt(
            diagnosticState
          )

        break;

      case ResponseMode.EMERGENCY_WARNING_MODE:

        systemInstruction += `

Emergency mode.

Advise urgent medical attention.

RETURN JSON ONLY.
`;

        break;
    }

    // -----------------------------------
    // MEMORY
    // -----------------------------------

    const compactMemory =
      this.buildCompactMemory(
        updatedMemory
      );

    systemInstruction += `

CURRENT MEDICAL MEMORY:
${JSON.stringify(compactMemory)}

MEDICAL STATE UPDATES:
${JSON.stringify(medicalStateUpdates)}
`;

    // -----------------------------------
    // GENERATE
    // -----------------------------------

    const response =
      await this.provider.generateText({

        model: modelName,

        systemInstruction,

        history: safeHistory,

        userInput: safeUserInput,

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
    // QUESTION VALIDATION
    // -----------------------------------

    if (

      decision.mode ===
      ResponseMode.CLARIFICATION_MODE

      &&

      !normalizedResponse.interviewCompleted

    ) {

      const validation =

        validateGeneratedQuestion(

          normalizedResponse.summary,

          diagnosticState.alreadyCovered
        );

      console.log(
        "Question validation:",
        validation
      );

      // -----------------------------------
      // FORCE STOP ON REPEATS
      // -----------------------------------

      if (!validation.valid) {

        normalizedResponse.summary =
          "Наиболее вероятно речь идет о нетяжелой проблеме, связанной с описанными симптомами. Если состояние ухудшается, появляется сильная боль, отек, онемение или другие тревожные симптомы — обратитесь к врачу.";

        normalizedResponse.interviewCompleted =
          true;

        normalizedResponse.quickReplies = [];

        console.log(
          "Repeated question blocked"
        );
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

    // -----------------------------------
    // FINAL
    // -----------------------------------

    return {

      text:
        normalizedResponse.summary,

      decision: {

        ...decision,

        interviewCompleted:
          normalizedResponse.interviewCompleted
      },

      updatedMemory,

      lastAnalysis:
        snapshot,

      quickReplies:
        normalizedResponse.quickReplies,

      structuredData:
        normalizedResponse,

      medicalStateUpdates
    };
  }
}