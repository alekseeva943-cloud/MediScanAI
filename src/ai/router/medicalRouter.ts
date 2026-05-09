// src/ai/router/medicalRouter.ts

// ESM: keep explicit .js extensions for runtime imports after TypeScript transpilation.

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
  // BUILD COMPACT ROUTER CONTEXT
  // -----------------------------------

  private buildCompactContext(
    userInput: string,
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ) {

    return {

      userMessage:
        userInput.slice(0, 1200),

      recentSymptoms:
        memory.symptoms.slice(-5),

      medications:
        memory.medications.slice(-5),

      hasPreviousAnalysis:
        !!lastAnalysis,

      hasImage:
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

      const prompt = `
You are a medical routing system.

You DO NOT diagnose.

You ONLY decide:
- does the AI need clarification?
- is this emergency?
- is there enough information for analysis?

VERY IMPORTANT:

If the user provides ONLY:
- one symptom
- vague pain
- short complaint
- incomplete medical info

You MUST choose:
CLARIFICATION_MODE

DO NOT jump directly to diagnosis.

The AI should FIRST collect:
- duration
- pain type
- severity
- swelling
- fever
- injury
- worsening symptoms
- movement limitation

EXAMPLES:

USER:
"My knee hurts"

CORRECT:
CLARIFICATION_MODE

USER:
"I have sharp knee pain for 3 days after falling, swelling, can't walk normally"

CORRECT:
FULL_MEDICAL_ANALYSIS

EMERGENCY CONDITIONS:
- chest pain
- breathing problems
- stroke symptoms
- severe allergic reaction
- severe bleeding
- suicidal intent
- unconsciousness

AVAILABLE MODES:

- CASUAL_CONVERSATION
- CLARIFICATION_MODE
- FULL_MEDICAL_ANALYSIS
- ANALYSIS_UPDATE_MODE
- EMERGENCY_WARNING_MODE

INPUT:
${JSON.stringify(compact)}

RETURN ONLY JSON.

FORMAT:
{
  "intent": "SYMPTOM_ANALYSIS",
  "mode": "CLARIFICATION_MODE",
  "needsClarification": true,
  "clarificationQuestions": [
    "Когда началась боль?",
    "Боль острая или тянущая?",
    "Есть ли отек?"
  ],
  "emergencyLevel": "low",
  "isUpdateToExisting": false
}
`;

      const text =
        await this.provider.generateRouterDecision(
          prompt
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
          parsed.clarificationQuestions || [],

        emergencyLevel:
          parsed.emergencyLevel || 'low',

        isUpdateToExisting:
          parsed.isUpdateToExisting || false
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
          "Когда появились симптомы?",
          "Что именно вас беспокоит?",
          "Есть ли дополнительные симптомы?"
        ],

        emergencyLevel: 'low',

        isUpdateToExisting: false
      };
    }
  }
}