// src/ai/orchestration/medicalOrchestrator.ts

// Главный orchestrator медицинского AI.
//
// Этот файл только координирует модули.
//
// Что делает orchestrator:
//
// - обновляет patient profile
// - обновляет memory
// - вызывает router
// - управляет interview flow
// - собирает diagnostic state
// - собирает system prompt
// - запускает response pipeline
// - возвращает финальный ответ
//
// ВАЖНО:
//
// Здесь НЕ должно быть:
// - giant prompts
// - parsing logic
// - normalization logic
// - validation logic
// - medical reasoning
//
// Всё это вынесено
// в отдельные модули.

import { MedicalRouter }
  from "../router/medicalRouter.js";

import { MedicalStateUpdater }
  from "./medicalStateUpdater.js";

import { ResponseMode }
  from "../types/index.js";

import type {

  MedicalMemory,

  AnalysisSnapshot,

  RouterDecision,

  AIMedicalUpdateResult

} from "../types/index.js";

import {
  buildDiagnosticState
} from "../interview/buildDiagnosticState.js";

import {
  buildInterviewState
} from "../interview/buildInterviewState.js";

import {
  mergeMedicalMemory
} from "../memory/mergeMedicalMemory.js";

import {
  EMPTY_PATIENT_PROFILE
} from "../profile/patientProfile.js";

import {
  PatientProfileUpdater
} from "../profile/updatePatientProfile.js";

import {
  buildSystemPrompt
} from "../prompts/buildSystemPrompt.js";

import {
  MedicalResponsePipeline
} from "../pipeline/medicalResponsePipeline.js";

export class MedicalOrchestrator {

  private router:
    MedicalRouter;

  private stateUpdater:
    MedicalStateUpdater;

  private profileUpdater:
    PatientProfileUpdater;

  private responsePipeline:
    MedicalResponsePipeline;

  constructor(apiKey?: string) {

    const key =

      apiKey

      ||

      process.env.OPENAI_API_KEY

      ||

      "";

    this.router =
      new MedicalRouter(key);

    this.stateUpdater =
      new MedicalStateUpdater(key);

    this.profileUpdater =
      new PatientProfileUpdater(
        key
      );

    this.responsePipeline =
      new MedicalResponsePipeline(
        key
      );
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
    // CURRENT PROFILE
    // -----------------------------------

    const currentProfile =

      memory.patientProfile

      ||

      EMPTY_PATIENT_PROFILE;

    // -----------------------------------
    // PROFILE UPDATE
    // -----------------------------------

    const updatedProfile =

      await this.profileUpdater
        .updateProfile(

          currentProfile,

          safeUserInput
        );

    console.log(
      "Updated patient profile:",
      updatedProfile
    );

    // -----------------------------------
    // UPDATE MEMORY
    // -----------------------------------

    const updatedMemory =

      mergeMedicalMemory(
        memory,
        {
          patientProfile:
            updatedProfile
        }
      );

    // -----------------------------------
    // MEDICAL STATE UPDATE
    // -----------------------------------

    let medicalStateUpdates:
      AIMedicalUpdateResult = {};

    try {

      medicalStateUpdates =

        await this.stateUpdater
          .updateMedicalState(

            safeUserInput,

            updatedMemory,

            lastAnalysis
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
        updatedMemory
      );

    // -----------------------------------
    // ROUTER
    // -----------------------------------

    const decision:
      RouterDecision =

      await this.router.decide(

        safeUserInput,

        safeHistory,

        updatedMemory,

        lastAnalysis
      );

    console.log(
      "Router decision:",
      decision
    );

    // -----------------------------------
    // FORCE FINISH
    // -----------------------------------

    if (

      decision.mode ===
      ResponseMode.CLARIFICATION_MODE

      &&

      interviewState
        .shouldFinishInterview

    ) {

      decision.mode =
        ResponseMode
          .FULL_MEDICAL_ANALYSIS;

      decision.interviewCompleted =
        true;
    }

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

    const {

      systemInstruction,

      modelName

    } = buildSystemPrompt({

      mode:
        decision.mode,

      diagnosticState,

      patientProfile:
        updatedProfile
    });

    // -----------------------------------
    // RESPONSE PIPELINE
    // -----------------------------------

    const {

      normalizedResponse,

      snapshot

    } = await this.responsePipeline
      .generateResponse({

        model:
          modelName,

        systemInstruction,

        history:
          safeHistory,

        userInput:
          safeUserInput,

        imageParts,

        decision,

        diagnosticState,

        interviewState,

        medicalStateUpdates
      });

    // -----------------------------------
    // FINAL
    // -----------------------------------

    return {

      text:
        normalizedResponse.summary,

      decision: {

        ...decision,

        interviewCompleted:

          normalizedResponse
            .interviewCompleted
      },

      updatedMemory,

      lastAnalysis:
        snapshot,

      quickReplies:
        normalizedResponse
          .quickReplies,

      structuredData:
        normalizedResponse,

      medicalStateUpdates
    };
  }
}