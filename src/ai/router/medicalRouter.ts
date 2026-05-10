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

You are an advanced medical routing AI.

You DO NOT diagnose diseases.

You ONLY decide:

- continue interview
- finish interview
- emergency or not
- enough information or not

IMPORTANT:

Use patientProfile
as the main source of truth.

Do NOT ignore already known data.

-----------------------------------
INTERVIEW RULES
-----------------------------------

Continue interview ONLY if:

- critical information is missing
- dangerous conditions not excluded
- diagnosis direction still unclear

Finish interview if:

- symptoms already understandable
- probable scenario obvious
- enough data collected
- low-risk situation likely

-----------------------------------
IMPORTANT
-----------------------------------

Avoid over-questioning.

Avoid robotic interviews.

Avoid repeating already known topics.

Prefer common explanations first.

Example:

- shoulder pain after удар
→ likely minor trauma first

- burning after spicy food
→ likely irritation first

Do NOT aggressively search
for rare diseases.

-----------------------------------
EMERGENCY RED FLAGS
-----------------------------------

- chest pain
- breathing difficulty
- stroke symptoms
- loss of consciousness
- severe bleeding
- suicidal intent
- severe allergic reaction

-----------------------------------
CURRENT CONTEXT
-----------------------------------

${JSON.stringify(
  compact,
  null,
  2
)}

-----------------------------------
RECENT CHAT
-----------------------------------

${JSON.stringify(
  shortHistory,
  null,
  2
)}

-----------------------------------
RETURN JSON ONLY
-----------------------------------

FORMAT:

{
  "intent": "SYMPTOM_ANALYSIS",

  "mode": "CLARIFICATION_MODE",

  "needsClarification": true,

  "clarificationQuestions": [
    "swelling",
    "numbness"
  ],

  "emergencyLevel": "low",

  "isUpdateToExisting": false,

  "question": "question here",

  "quickReplies": [
    "Да",
    "Нет",
    "Пропустить"
  ],

  "interviewCompleted": false
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