// src/ai/orchestration/medicalOrchestrator.ts

// ESM: keep explicit .js extensions for runtime imports after TypeScript transpilation.

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

    const key = apiKey || process.env.OPENAI_API_KEY || '';

    this.provider = new OpenAIProvider(key);

    this.router = new MedicalRouter(key);
  }

  private async extractMemory(
    userInput: string,
    memory: MedicalMemory
  ): Promise<Partial<MedicalMemory>> {

    try {

      const prompt = `
${MEMORY_EXTRACTION_PROMPT}

CURRENT MEMORY:
${JSON.stringify(memory)}

NEW USER MESSAGE:
${userInput}
`;

      const text =
        await this.provider.generateRouterDecision(prompt);

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleaned);

    } catch (error) {

      console.error("Memory extraction error:", error);

      return {};
    }
  }

  async processRequest(
    userInput: string,
    imageParts: any[],
    history: any[],
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ) {

    // 1. Route the request

    const decision: RouterDecision =
      await this.router.decide(
        userInput,
        history,
        memory,
        lastAnalysis
      );

    console.log("Orchestrator decision:", decision);

    // 2. Extract updated memory

    const extractedMemory =
      await this.extractMemory(userInput, memory);

    const updatedMemory: MedicalMemory = {
      ...memory,

      ...extractedMemory,

      symptoms: [
        ...new Set([
          ...memory.symptoms,
          ...(extractedMemory.symptoms || [])
        ])
      ],

      medications: [
        ...new Set([
          ...memory.medications,
          ...(extractedMemory.medications || [])
        ])
      ],

      diagnoses: [
        ...new Set([
          ...memory.diagnoses,
          ...(extractedMemory.diagnoses || [])
        ])
      ],

      allergies: [
        ...new Set([
          ...memory.allergies,
          ...(extractedMemory.allergies || [])
        ])
      ],

      riskFactors: [
        ...new Set([
          ...memory.riskFactors,
          ...(extractedMemory.riskFactors || [])
        ])
      ],

      extractedFacts: [
        ...new Set([
          ...memory.extractedFacts,
          ...(extractedMemory.extractedFacts || [])
        ])
      ],

      chronicConditions: [
        ...new Set([
          ...(memory.chronicConditions || []),
          ...(extractedMemory.chronicConditions || [])
        ])
      ],

      surgeries: [
        ...new Set([
          ...(memory.surgeries || []),
          ...(extractedMemory.surgeries || [])
        ])
      ],

      familyHistory: [
        ...new Set([
          ...(memory.familyHistory || []),
          ...(extractedMemory.familyHistory || [])
        ])
      ]
    };

    // 3. Build system prompt

    let systemInstruction = SYSTEM_PROMPT;

    let modelName:
      "gpt-4o-mini" | "gpt-4.1-mini" = "gpt-4o-mini";

    switch (decision.mode) {

      case ResponseMode.FULL_MEDICAL_ANALYSIS:

        systemInstruction += "\n" + ANALYSIS_PROMPT;

        modelName = "gpt-4.1-mini";

        break;

      case ResponseMode.ANALYSIS_UPDATE_MODE:

        systemInstruction += "\n" + UPDATE_ANALYSIS_PROMPT;

        systemInstruction += `
PREVIOUS ANALYSIS:
${JSON.stringify(lastAnalysis)}
`;

        break;

      case ResponseMode.CLARIFICATION_MODE:

        systemInstruction += `
You are in clarification mode.

Ask ONLY these questions:
${decision.clarificationQuestions.join("\n")}
`;

        break;

      case ResponseMode.EMERGENCY_WARNING_MODE:

        systemInstruction += `
CRITICAL MEDICAL SITUATION.

Advise immediate emergency medical attention.
`;

        break;
    }

    // 4. Inject memory into system prompt

    systemInstruction += `

CURRENT MEDICAL MEMORY:
${JSON.stringify(updatedMemory)}
`;

    // 5. Generate response

    const text = await this.provider.generateText({
      model: modelName,
      systemInstruction,
      history,
      userInput,
      imageParts
    });

    return {
      text,
      decision,
      updatedMemory
    };
  }
}