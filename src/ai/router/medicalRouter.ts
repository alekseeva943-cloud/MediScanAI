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

      previousDiagnoses:
        memory.diagnoses.slice(-5),

      extractedFacts:
        memory.extractedFacts.slice(-10),

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

      const shortHistory =
        history
          .slice(-6)
          .map((m: any) => ({
            role: m.role,
            content: String(m.content).slice(0, 300)
          }));

      const prompt = `
You are an advanced medical AI router.

You NEVER diagnose.

You ONLY decide:
- Does the AI need more clarification?
- Is there enough data for medical analysis?
- Is this an emergency?
- What is the best next interview direction?

CRITICAL BEHAVIOR:

The AI must behave like a real medical assistant.

If information is incomplete:
→ choose CLARIFICATION_MODE

If information is detailed enough:
→ choose FULL_MEDICAL_ANALYSIS

DO NOT ask many questions at once.

DO NOT generate questionnaires.

The interview must feel natural and adaptive.

GOOD:
User: "My elbow is swollen"
AI: clarification

GOOD:
User: "My elbow is swollen for 5 days after trauma, severe pain, fever"
AI: analysis

EMERGENCY CONDITIONS:
- chest pain
- breathing difficulty
- stroke symptoms
- suicidal intent
- severe allergic reaction
- loss of consciousness
- severe bleeding

AVAILABLE MODES:

- CASUAL_CONVERSATION
- CLARIFICATION_MODE
- FULL_MEDICAL_ANALYSIS
- ANALYSIS_UPDATE_MODE
- EMERGENCY_WARNING_MODE

CURRENT CONTEXT:
${JSON.stringify(compact)}

RECENT CHAT:
${JSON.stringify(shortHistory)}

RETURN ONLY JSON.

FORMAT:
{
  "intent": "SYMPTOM_ANALYSIS",
  "mode": "CLARIFICATION_MODE",
  "needsClarification": true,
  "clarificationQuestions": [
    "duration",
    "pain",
    "severity",
    "swelling",
    "mobility"
  ],
  "emergencyLevel": "low",
  "isUpdateToExisting": false
}

IMPORTANT:
clarificationQuestions are NOT real questions.

They are ONLY interview topics for the AI interviewer.

Use short topic names only.
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
          "duration",
          "pain",
          "severity"
        ],

        emergencyLevel: 'low',

        isUpdateToExisting: false
      };
    }
  }
}