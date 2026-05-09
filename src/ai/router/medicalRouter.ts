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
        userInput.slice(0, 1500),

      recentSymptoms:
        memory.symptoms.slice(-5),

      medications:
        memory.medications.slice(-5),

      hasPreviousAnalysis:
        !!lastAnalysis
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
You are a lightweight medical AI router.

Your ONLY task is choosing response mode.

DO NOT provide medical analysis.

AVAILABLE MODES:

1. CASUAL_CONVERSATION
- greetings
- simple conversation
- casual questions

2. CLARIFICATION_MODE
- not enough information
- missing symptoms/details

3. FULL_MEDICAL_ANALYSIS
- multiple symptoms
- medical reports
- images
- complex requests
- analysis requests

4. ANALYSIS_UPDATE_MODE
- user updates previous analysis
- user adds new symptoms to existing case

5. EMERGENCY_WARNING_MODE
- chest pain
- breathing difficulty
- stroke symptoms
- severe bleeding
- suicidal intent
- loss of consciousness
- severe allergic reaction

IMPORTANT:
Be strict.
Do NOT over-trigger FULL_MEDICAL_ANALYSIS.

INPUT:
${JSON.stringify(compact)}

Return ONLY valid JSON.

FORMAT:
{
  "intent": "CASUAL_CHAT",
  "mode": "CASUAL_CONVERSATION",
  "needsClarification": false,
  "clarificationQuestions": [],
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
          UserIntent.CASUAL_CHAT,

        mode:
          parsed.mode ||
          ResponseMode.CASUAL_CONVERSATION,

        needsClarification:
          parsed.needsClarification || false,

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
          ResponseMode.CASUAL_CONVERSATION,

        needsClarification: false,

        clarificationQuestions: [],

        emergencyLevel: 'low',

        isUpdateToExisting: false
      };
    }
  }
}