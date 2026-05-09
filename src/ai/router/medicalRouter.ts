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
    const key = apiKey || process.env.OPENAI_API_KEY || '';

    this.provider = new OpenAIProvider(key);
  }

  async decide(
    userInput: string,
    history: any[],
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ): Promise<RouterDecision> {

    const recentHistory = history
      .slice(-5)
      .map((m) => {
        const content =
          typeof m.content === "string"
            ? m.content
            : JSON.stringify(m.content);

        return `${m.role}: ${content}`;
      })
      .join("\n");

    const previousAnalysisSummary = lastAnalysis
      ? `
PREVIOUS ANALYSIS SUMMARY:
${lastAnalysis.summary}

PREVIOUS RISKS:
${lastAnalysis.risks.join(", ")}

PREVIOUS DIAGNOSES:
${lastAnalysis.probableDiagnoses.join(", ")}
`
      : "NO PREVIOUS ANALYSIS";

    const prompt = `
You are a deterministic Medical AI Router.

Your task:
Analyze the user request and return ONLY valid JSON.

DO NOT explain anything.
DO NOT use markdown.
DO NOT wrap JSON in backticks.
RETURN JSON ONLY.

====================
USER INPUT
====================

${userInput}

====================
RECENT HISTORY
====================

${recentHistory}

====================
MEDICAL MEMORY
====================

${JSON.stringify(memory)}

====================
PREVIOUS ANALYSIS
====================

${previousAnalysisSummary}

====================
AVAILABLE INTENTS
====================

- CASUAL_CHAT
- SYMPTOM_ANALYSIS
- MEDICATION_CHECK
- DOCUMENT_ANALYSIS
- EMERGENCY_RISK
- FOLLOW_UP

====================
AVAILABLE MODES
====================

- CASUAL_CONVERSATION
- CLARIFICATION_MODE
- PRELIMINARY_ANALYSIS
- FULL_MEDICAL_ANALYSIS
- ANALYSIS_UPDATE_MODE
- EMERGENCY_WARNING_MODE

====================
ROUTING RULES
====================

1. EMERGENCY_WARNING_MODE:
Use ONLY if symptoms may indicate immediate danger:
- chest pain
- stroke symptoms
- severe bleeding
- loss of consciousness
- suicidal intent
- respiratory distress

2. ANALYSIS_UPDATE_MODE:
Use ONLY if:
- previous analysis exists
AND
- user adds new medical information
AND
- user refers to previous findings

3. CLARIFICATION_MODE:
Use if important information is missing.

4. FULL_MEDICAL_ANALYSIS:
Use for:
- complex symptom analysis
- medication interaction analysis
- document interpretation
- multi-factor medical questions

5. PRELIMINARY_ANALYSIS:
Use for short/simple medical questions.

6. CASUAL_CONVERSATION:
Use ONLY for greetings or non-medical chat.

====================
OUTPUT FORMAT
====================

{
  "intent": "ONE OF AVAILABLE INTENTS",
  "mode": "ONE OF AVAILABLE MODES",
  "needsClarification": true,
  "clarificationQuestions": ["question 1"],
  "emergencyLevel": "low",
  "isUpdateToExisting": false
}
`;

    try {
      const text = await this.provider.generateRouterDecision(prompt);

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      return {
        intent: parsed.intent || UserIntent.CASUAL_CHAT,

        mode: parsed.mode || ResponseMode.CASUAL_CONVERSATION,

        needsClarification:
          parsed.needsClarification || false,

        clarificationQuestions:
          parsed.clarificationQuestions || [],

        emergencyLevel:
          parsed.emergencyLevel || "low",

        isUpdateToExisting:
          parsed.isUpdateToExisting || false
      };

    } catch (error) {

      console.error("Router error:", error);

      return {
        intent: UserIntent.CASUAL_CHAT,

        mode: ResponseMode.CASUAL_CONVERSATION,

        needsClarification: false,

        clarificationQuestions: [],

        emergencyLevel: 'low',

        isUpdateToExisting: false
      };
    }
  }
}