// src/ai/router/medicalRouter.ts

import { OpenAIProvider } from "../providers/openaiProvider.js";

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

  private provider: OpenAIProvider;

  constructor(apiKey?: string) {

    const key =
      apiKey ||
      process.env.OPENAI_API_KEY ||
      '';

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

      symptoms:
        memory.symptoms.slice(-10),

      medications:
        memory.medications.slice(-10),

      diagnoses:
        memory.diagnoses.slice(-10),

      extractedFacts:
        memory.extractedFacts.slice(-20),

      uploadedDocuments:
        memory.uploadedDocuments.slice(-5),

      hasPreviousAnalysis:
        !!lastAnalysis,

      hasMedicalFiles:
        memory.uploadedDocuments.length > 0
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
          .slice(-8)
          .map((m: any) => ({
            role: m.role,
            content:
              String(m.content)
                .slice(0, 500)
          }));

      const prompt = `
You are an advanced AI medical router.

IMPORTANT:
You are NOT diagnosing diseases.

You decide:
- does the AI need clarification?
- is there enough information?
- is this emergency?
- should interview continue?

CRITICAL RULES:

- Think like a premium medical assistant.
- Interviews must feel natural.
- Questions must adapt dynamically.
- Avoid robotic behavior.
- Avoid fixed questionnaires.
- Never ask many questions at once.

EMERGENCY CONDITIONS:
- chest pain
- breathing difficulty
- stroke symptoms
- loss of consciousness
- severe allergic reaction
- suicidal intent
- severe bleeding

AVAILABLE MODES:

- CASUAL_CONVERSATION
- CLARIFICATION_MODE
- FULL_MEDICAL_ANALYSIS
- ANALYSIS_UPDATE_MODE
- EMERGENCY_WARNING_MODE

WHEN TO USE CLARIFICATION_MODE:
- symptoms unclear
- insufficient data
- interview should continue

WHEN TO USE FULL_MEDICAL_ANALYSIS:
- enough medically relevant data exists
- symptoms sufficiently clarified
- user uploaded tests/images
- enough context for preliminary analysis

CURRENT CONTEXT:
${JSON.stringify(compact)}

RECENT CHAT:
${JSON.stringify(shortHistory)}

RETURN ONLY VALID JSON.

FORMAT:
{
  "intent": "SYMPTOM_ANALYSIS",
  "mode": "CLARIFICATION_MODE",
  "needsClarification": true,
  "clarificationQuestions": [
    "duration",
    "severity",
    "swelling"
  ],
  "emergencyLevel": "low",
  "isUpdateToExisting": false,
  "question": "question here",
  "quickReplies": [
    "option 1",
    "option 2",
    "Пропустить"
  ],
  "interviewCompleted": false
}
`;

      const text =
        await this.provider.generateRouterDecision(
          prompt
        );

      console.log(
        "RAW ROUTER RESPONSE:",
        text
      );

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed =
        JSON.parse(cleaned);

      return {

        intent:
          parsed.intent ||
          UserIntent.SYMPTOM_ANALYSIS,

        mode:
          parsed.mode ||
          ResponseMode.CLARIFICATION_MODE,

        needsClarification:
          parsed.needsClarification ?? true,

        clarificationQuestions:

          Array.isArray(
            parsed.clarificationQuestions
          )

            ? parsed.clarificationQuestions

            : [],

        emergencyLevel:
          parsed.emergencyLevel || 'low',

        isUpdateToExisting:
          parsed.isUpdateToExisting || false,

        question:
          parsed.question || "",

        quickReplies:

          Array.isArray(
            parsed.quickReplies
          )

            ? parsed.quickReplies

            : ["Пропустить"],

        interviewCompleted:
          parsed.interviewCompleted || false
      };

    } catch (error) {

      console.error(
        "Router error:",
        error
      );

      return {

        intent:
          UserIntent.CASUAL_CHAT,

        mode:
          ResponseMode.CLARIFICATION_MODE,

        needsClarification: true,

        clarificationQuestions: [
          "details"
        ],

        emergencyLevel: 'low',

        isUpdateToExisting: false,

        question:
          "Расскажите подробнее о симптомах.",

        quickReplies: [

          "Добавить детали",

          "📷 Загрузить фото",

          "🧪 Прикрепить анализы",

          "Пропустить"
        ],

        interviewCompleted: false
      };
    }
  }
}