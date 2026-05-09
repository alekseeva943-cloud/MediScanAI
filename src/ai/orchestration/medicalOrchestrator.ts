// src/ai/orchestration/medicalOrchestrator.ts

import { OpenAIProvider } from "../providers/openaiProvider.js";

import { MedicalRouter } from "../router/medicalRouter.js";

import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

import { ANALYSIS_PROMPT } from "../prompts/analysisPrompt.js";

import { UPDATE_ANALYSIS_PROMPT } from "../prompts/updateAnalysisPrompt.js";

import { MEMORY_EXTRACTION_PROMPT } from "../prompts/memoryExtractionPrompt.js";

import { ResponseMode } from "../types/index.js";

import type {
  MedicalMemory,
  AnalysisSnapshot,
  RouterDecision
} from "../types/index.js";

export class MedicalOrchestrator {

  private provider: OpenAIProvider;

  private router: MedicalRouter;

  constructor(apiKey?: string) {

    const key =
      apiKey ||
      process.env.OPENAI_API_KEY ||
      '';

    this.provider =
      new OpenAIProvider(key);

    this.router =
      new MedicalRouter(key);
  }

  // -----------------------------------
  // COMPACT MEMORY
  // -----------------------------------

  private buildCompactMemory(
    memory: MedicalMemory
  ) {

    return {

      symptoms:
        memory.symptoms.slice(-10),

      medications:
        memory.medications.slice(-10),

      diagnoses:
        memory.diagnoses.slice(-10),

      allergies:
        memory.allergies.slice(-10),

      riskFactors:
        memory.riskFactors.slice(-10),

      extractedFacts:
        memory.extractedFacts.slice(-15),

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
      history.slice(-5);

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

    const updatedMemory: MedicalMemory = {

      ...memory,

      ...extractedMemory,

      symptoms: [

        ...new Set([

          ...memory.symptoms,

          ...(extractedMemory.symptoms || [])
        ])

      ].slice(-20),

      medications: [

        ...new Set([

          ...memory.medications,

          ...(extractedMemory.medications || [])
        ])

      ].slice(-20),

      diagnoses: [

        ...new Set([

          ...memory.diagnoses,

          ...(extractedMemory.diagnoses || [])
        ])

      ].slice(-20),

      allergies: [

        ...new Set([

          ...memory.allergies,

          ...(extractedMemory.allergies || [])
        ])

      ].slice(-20),

      riskFactors: [

        ...new Set([

          ...memory.riskFactors,

          ...(extractedMemory.riskFactors || [])
        ])

      ].slice(-20),

      extractedFacts: [

        ...new Set([

          ...memory.extractedFacts,

          ...(extractedMemory.extractedFacts || [])
        ])

      ].slice(-30),

      chronicConditions: [

        ...new Set([

          ...(memory.chronicConditions || []),

          ...(extractedMemory.chronicConditions || [])
        ])

      ].slice(-20),

      surgeries: [

        ...new Set([

          ...(memory.surgeries || []),

          ...(extractedMemory.surgeries || [])
        ])

      ].slice(-20),

      familyHistory: [

        ...new Set([

          ...(memory.familyHistory || []),

          ...(extractedMemory.familyHistory || [])
        ])

      ].slice(-20)
    };

    // -----------------------------------
    // SYSTEM PROMPT
    // -----------------------------------

    let systemInstruction =
      SYSTEM_PROMPT;

    let modelName:
      "gpt-4o-mini" |
      "gpt-4.1-mini" =
        "gpt-4o-mini";

    // -----------------------------------
    // ANALYSIS MODES
    // -----------------------------------

    switch (decision.mode) {

      case ResponseMode.FULL_MEDICAL_ANALYSIS:

        systemInstruction +=
          "\n" + ANALYSIS_PROMPT;

        modelName =
          "gpt-4.1-mini";

        break;

      case ResponseMode.ANALYSIS_UPDATE_MODE:

        systemInstruction +=
          "\n" + UPDATE_ANALYSIS_PROMPT;

        if (lastAnalysis) {

          systemInstruction += `

PREVIOUS ANALYSIS SUMMARY:
${lastAnalysis.summary?.slice(0, 1200) || ""}

PREVIOUS RISKS:
${(lastAnalysis.risks || [])
  .slice(0, 10)
  .join(", ")}

PREVIOUS DIAGNOSES:
${(lastAnalysis.probableDiagnoses || [])
  .slice(0, 10)
  .join(", ")}
`;
        }

        break;

      // -----------------------------------
      // AI INTERVIEW MODE
      // -----------------------------------

      case ResponseMode.CLARIFICATION_MODE:

        systemInstruction += `

You are now in PREMIUM AI MEDICAL INTERVIEW MODE.

YOUR JOB:
Conduct a smart adaptive medical interview.

CRITICAL RULES:

- Ask ONLY ONE question at a time.
- The interview must feel natural.
- Behave like a real medical assistant.
- Questions must adapt dynamically.
- Never use static questionnaires.
- Never repeat questions.
- Never ask many questions together.
- Keep questions concise.
- Focus on the most medically important next step.

IMPORTANT:
You MUST return ONLY VALID JSON.

RETURN FORMAT:

{
  "summary": "question here",
  "quick_replies": [
    "option 1",
    "option 2",
    "Пропустить"
  ],
  "interviewCompleted": false
}

QUICK REPLY RULES:

- Always include "Пропустить"
- Generate medically relevant buttons
- Buttons must sound natural
- Buttons must match the question

WHEN ENOUGH DATA EXISTS:

{
  "summary":
    "Информации достаточно для предварительной оценки.",

  "quick_replies": [
    "📄 Создать отчет",
    "🩻 Загрузить МРТ",
    "🧪 Прикрепить анализы",
    "📷 Загрузить фото",
    "➕ Добавить симптомы"
  ],

  "interviewCompleted": true
}

ONLY JSON.
`;

        break;

      // -----------------------------------
      // EMERGENCY
      // -----------------------------------

      case ResponseMode.EMERGENCY_WARNING_MODE:

        systemInstruction += `

CRITICAL MEDICAL SITUATION.

Advise immediate emergency medical attention.

RETURN ONLY JSON.

FORMAT:

{
  "summary":
    "Это может требовать срочной медицинской помощи.",

  "quick_replies": [
    "🚑 Вызвать скорую",
    "👨‍⚕️ Связаться с врачом",
    "Пропустить"
  ],

  "interviewCompleted": true
}
`;

        break;
    }

    // -----------------------------------
    // MEMORY INJECTION
    // -----------------------------------

    const compactMemory =
      this.buildCompactMemory(
        updatedMemory
      );

    systemInstruction += `

CURRENT MEDICAL MEMORY:
${JSON.stringify(compactMemory)}
`;

    // -----------------------------------
    // GENERATE RESPONSE
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
    // PARSE AI JSON
    // -----------------------------------

    let parsedInterview: any =
      null;

    try {

      const cleaned = response

        .replace(/```json/g, '')

        .replace(/```/g, '')

        .trim();

      parsedInterview =
        JSON.parse(cleaned);

    } catch {

      parsedInterview = null;
    }

    // -----------------------------------
    // NORMALIZED RESPONSE
    // -----------------------------------

    const normalizedResponse = {

      summary:

        parsedInterview?.summary

        ||

        parsedInterview?.message

        ||

        response,

      probableDiagnoses:

        Array.isArray(
          parsedInterview?.probableDiagnoses
        )

          ? parsedInterview.probableDiagnoses

          : [],

      reasoning:

        Array.isArray(
          parsedInterview?.reasoning
        )

          ? parsedInterview.reasoning

          : [],

      risks:

        Array.isArray(
          parsedInterview?.risks
        )

          ? parsedInterview.risks

          : [],

      recommendations:

        Array.isArray(
          parsedInterview?.recommendations
        )

          ? parsedInterview.recommendations

          : [],

      medications:

        Array.isArray(
          parsedInterview?.medications
        )

          ? parsedInterview.medications

          : [],

      suggested_actions:

        Array.isArray(
          parsedInterview?.suggested_actions
        )

          ? parsedInterview.suggested_actions

          : [],

      quickReplies:

        Array.isArray(
          parsedInterview?.quick_replies
        )

          ? parsedInterview.quick_replies

          : Array.isArray(
              parsedInterview?.quickReplies
            )

            ? parsedInterview.quickReplies

            : [],

      danger_level:

        parsedInterview?.danger_level

        ||

        decision?.emergencyLevel

        ||

        "low",

      interviewCompleted:

        parsedInterview
          ?.interviewCompleted || false
    };

    // -----------------------------------
    // SNAPSHOT
    // -----------------------------------

    const snapshot = {

      ...normalizedResponse,

      timestamp:
        Date.now()
    };

    // -----------------------------------
    // FINAL RESPONSE
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
        normalizedResponse
    };
  }
}