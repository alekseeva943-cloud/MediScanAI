// src/ai/router/medicalRouter.ts

// Medical router.
//
// Этот модуль НЕ ставит диагноз.
//
// Он решает:
//
// - продолжать ли интервью
// - достаточно ли информации
// - есть ли emergency
// - нужен ли анализ
//
// Router теперь работает
// через structured patient profile.

import { OpenAIProvider }
  from "../providers/openaiProvider.js";

import {

  UserIntent,

  ResponseMode

} from "../types/index.js";

import type {

  RouterDecision,

  MedicalMemory,

  AnalysisSnapshot

} from "../types/index.js";

export class MedicalRouter {

  private provider:
    OpenAIProvider;

  constructor(apiKey?: string) {

    const key =

      apiKey

      ||

      process.env.OPENAI_API_KEY

      ||

      "";

    this.provider =
      new OpenAIProvider(key);
  }

  // -----------------------------------
  // BUILD CONTEXT
  // -----------------------------------

  private buildCompactContext(
    userInput: string,
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ) {

    return {

      currentMessage:
        userInput.slice(0, 1500),

      patientProfile:
        memory.patientProfile,

      hasPreviousAnalysis:
        !!lastAnalysis,

      hasMedicalFiles:

        memory.uploadedDocuments
          .length > 0
    };
  }

  // -----------------------------------
  // ROUTER
  // -----------------------------------

  async decide(
    userInput: string,
    history: any[],
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ): Promise<RouterDecision> {

    try {

      console.log(
        "ROUTER PROFILE:",
        JSON.stringify(
          memory.patientProfile,
          null,
          2
        )
      );



      const compact =

        this.buildCompactContext(

          userInput,

          memory,

          lastAnalysis
        );

      const shortHistory =

        history

          .slice(-6)

          .map((m: any) => ({

            role:
              m.role,

            content:

              String(m.content)
                .slice(0, 300)
          }));

      const prompt = `

You are an elite medical interview routing AI.

You DO NOT diagnose diseases.

You ONLY decide:

- continue interview
- finish interview
- emergency or not
- enough information or not

IMPORTANT:

The patientProfile is the SINGLE SOURCE OF TRUTH.

You MUST rely on:

- resolvedTopics
- missingTopics
- confirmed findings
- negative findings

DO NOT invent missing data.

DO NOT ignore already collected information.

--------------------------------------------------
CORE INTERVIEW RULES
--------------------------------------------------

Continue interview ONLY if:

- missingTopics contains clinically useful gaps
- dangerous conditions are still possible
- important clarification is still required

Finish interview if:

- enough information already exists
- symptoms are understandable
- likely low-risk scenario
- profile already contains:
  - complaint
  - symptom character
  - duration OR trigger
  - absence of major red flags

IMPORTANT:

Do NOT endlessly search for more data.

A premium medical assistant asks
MINIMUM useful questions.

--------------------------------------------------
ANTI-LOOP RULES
--------------------------------------------------

NEVER ask again about topics already inside:

- resolvedTopics
- negativeFindings
- confirmed findings

Examples:

If profile already contains:

pain.character = "тупая"

DO NOT ask:

- "Какая боль?"
- "Опишите характер боли"
- "Боль острая или тупая?"

If negativeFindings contains:

- "отек"

DO NOT ask again about swelling.

--------------------------------------------------
--------------------------------------------------
INTERVIEW MINIMUM REQUIREMENTS
--------------------------------------------------

Before interview can finish,
profile should usually contain:

- main complaint
- symptom location
- symptom character OR severity
- duration OR trigger
- at least one clarification question completed

If profile is too sparse:

DO NOT finish interview yet.

Continue clarification.

--------------------------------------------------
EMERGENCY RED FLAGS
--------------------------------------------------

- chest pain
- severe breathing difficulty
- stroke symptoms
- severe bleeding
- loss of consciousness
- suicidal intent
- severe allergic reaction

--------------------------------------------------
CURRENT PROFILE
--------------------------------------------------

${JSON.stringify(
        compact.patientProfile,
        null,
        2
      )}

--------------------------------------------------
LAST USER MESSAGE
--------------------------------------------------

${userInput}

--------------------------------------------------
RECENT CHAT
--------------------------------------------------

${JSON.stringify(
        shortHistory,
        null,
        2
      )}

--------------------------------------------------
RETURN JSON ONLY
--------------------------------------------------

FORMAT:

{
  "intent": "SYMPTOM_ANALYSIS",

  "mode": "CLARIFICATION_MODE",

  "needsClarification": true,

  "clarificationQuestions": [
    "duration"
  ],

  "emergencyLevel": "low",

  "isUpdateToExisting": false,

  "question": "Когда начались симптомы?",

  "quickReplies": [
    "Сегодня",
    "1-3 дня",
    "Больше недели",
    "Пропустить"
  ],

  "interviewCompleted": false
}

IF INTERVIEW SHOULD FINISH:

{
  "intent": "SYMPTOM_ANALYSIS",

  "mode": "FULL_MEDICAL_ANALYSIS",

  "needsClarification": false,

  "clarificationQuestions": [],

  "emergencyLevel": "low",

  "isUpdateToExisting": false,

  "question": "",

  "quickReplies": [],

  "interviewCompleted": true
}
`;

      const text =

        await this.provider
          .generateRouterDecision(
            prompt
          );

      console.log(
        "RAW ROUTER RESPONSE:",
        text
      );

      const cleaned =

        text

          .replace(/```json/g, "")

          .replace(/```/g, "")

          .trim();

      const parsed =
        JSON.parse(cleaned);

      return {

        intent:

          parsed.intent

          ||

          UserIntent
            .SYMPTOM_ANALYSIS,

        mode:

          parsed.mode

          ||

          ResponseMode
            .CLARIFICATION_MODE,

        needsClarification:

          parsed
            .needsClarification

          ??

          true,

        clarificationQuestions:

          Array.isArray(
            parsed
              .clarificationQuestions
          )

            ? parsed
              .clarificationQuestions

            : [],

        emergencyLevel:

          parsed.emergencyLevel

          ||

          "low",

        isUpdateToExisting:

          parsed
            .isUpdateToExisting

          ||

          false,

        question:

          parsed.question

          ||

          "",

        quickReplies:

          Array.isArray(
            parsed.quickReplies
          )

            ? parsed.quickReplies

            : [
              "Пропустить"
            ],

        interviewCompleted:

          parsed
            .interviewCompleted

          ||

          false
      };

    } catch (error) {

      console.error(
        "Router error:",
        error
      );

      return {

        intent:
          UserIntent
            .SYMPTOM_ANALYSIS,

        mode:
          ResponseMode
            .CLARIFICATION_MODE,

        needsClarification:
          true,

        clarificationQuestions: [
          "details"
        ],

        emergencyLevel:
          "low",

        isUpdateToExisting:
          false,

        question:
          "Расскажите подробнее о симптомах.",

        quickReplies: [

          "Добавить детали",

          "📷 Загрузить фото",

          "🧪 Прикрепить анализы",

          "Пропустить"
        ],

        interviewCompleted:
          false
      };
    }
  }
}