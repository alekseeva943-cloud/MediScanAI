// src/ai/prompts/buildSystemPrompt.ts

// Этот файл отвечает за сборку
// итогового system prompt для медицинского AI.
//
// Здесь собираются:
//
// - базовый SYSTEM_PROMPT,
// - режим анализа,
// - режим уточнений,
// - emergency режим,
// - patient profile,
// - diagnostic state.
//
// Главная цель:
// убрать giant prompt-логику
// из medicalOrchestrator.ts

import { SYSTEM_PROMPT }
  from "./systemPrompt.js";

import { ANALYSIS_PROMPT }
  from "./analysisPrompt.js";

import { UPDATE_ANALYSIS_PROMPT }
  from "./updateAnalysisPrompt.js";

import { buildClarificationPrompt }
  from "./buildClarificationPrompt.js";

import { ResponseMode }
  from "../types/index.js";

import type {
  DiagnosticState
} from "../interview/buildDiagnosticState.js";

import type {
  PatientProfile
} from "../profile/patientProfile.js";

interface BuildSystemPromptParams {

  mode: ResponseMode;

  diagnosticState: DiagnosticState;

  patientProfile: PatientProfile;
}

export function buildSystemPrompt({
  mode,
  diagnosticState,
  patientProfile
}: BuildSystemPromptParams): {

  systemInstruction: string;

  modelName:
    | "gpt-4o-mini"
    | "gpt-4.1-mini";
} {

  let systemInstruction =
    SYSTEM_PROMPT;

  let modelName:
    | "gpt-4o-mini"
    | "gpt-4.1-mini" =
    "gpt-4o-mini";

  // -----------------------------------
  // PATIENT PROFILE
  // -----------------------------------

  systemInstruction += `

PATIENT PROFILE:

${JSON.stringify(
  patientProfile,
  null,
  2
)}
`;

  // -----------------------------------
  // MODES
  // -----------------------------------

  switch (mode) {

    // -----------------------------------
    // FULL ANALYSIS
    // -----------------------------------

    case ResponseMode.FULL_MEDICAL_ANALYSIS:

      modelName =
        "gpt-4.1-mini";

      systemInstruction += `

${ANALYSIS_PROMPT}

IMPORTANT:

- Stop asking questions.
- The interview is already sufficient.
- Use patient profile as the main source of truth.
- Start from the most common explanation.
- Avoid rare diagnoses without strong evidence.
- Mention red flags ONLY if relevant.
- Give concise practical recommendations.
`;

      break;

    // -----------------------------------
    // ANALYSIS UPDATE
    // -----------------------------------

    case ResponseMode.ANALYSIS_UPDATE_MODE:

      systemInstruction += `

${UPDATE_ANALYSIS_PROMPT}
`;

      break;

    // -----------------------------------
    // CLARIFICATION
    // -----------------------------------

    case ResponseMode.CLARIFICATION_MODE:

      systemInstruction +=
        buildClarificationPrompt(
          diagnosticState
        );

      break;

    // -----------------------------------
    // EMERGENCY
    // -----------------------------------

    case ResponseMode.EMERGENCY_WARNING_MODE:

      systemInstruction += `

Emergency mode.

Advise urgent medical attention.

RETURN JSON ONLY.
`;

      break;
  }

  return {

    systemInstruction,

    modelName
  };
}