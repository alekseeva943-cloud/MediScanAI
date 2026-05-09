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

    // -------------------------
    // ROUTER
    // -------------------------

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

    // -------------------------
    // MEMORY EXTRACTION
    // -------------------------

    const extractedMemory =
      await this.extractMemory(
        safeUserInput,
        memory
      );

    // -------------------------
    // UPDATE MEMORY
    // -------------------------

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

    // -------------------------
    // SYSTEM PROMPT
    // -------------------------

    let systemInstruction =
      SYSTEM_PROMPT;

    let modelName:
      "gpt-4o-mini" |
      "gpt-4.1-mini" =
        "gpt-4o-mini";

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
${lastAnalysis.summary.slice(0, 1200)}

PREVIOUS RISKS:
${lastAnalysis.risks
  .slice(0, 10)
  .join(", ")}

PREVIOUS DIAGNOSES:
${lastAnalysis.probableDiagnoses
  .slice(0, 10)
  .join(", ")}
`;
        }

        break;

      // -----------------------------------
      // STRICT INTERVIEW MODE
      // -----------------------------------

      case ResponseMode.CLARIFICATION_MODE:

        systemInstruction += `

You are now in STRICT MEDICAL INTERVIEW MODE.

CRITICAL RULES:

- Ask ONLY ONE short medical question.
- Never ask multiple questions at once.
- Never generate questionnaires.
- Never generate answer options inside the text.
- Never write long explanations.
- Never write diagnosis assumptions.
- Never generate large text blocks.
- Keep the message under 20 words.
- Focus ONLY on the single most important next question.
- Behave like a calm medical assistant.
- Questions must feel natural and conversational.

GOOD:
"Когда появились симптомы?"

BAD:
"Когда появились симптомы? Сегодня / Вчера / Давно"

BAD:
"Когда появились симптомы? Есть ли температура?"

INTERVIEW CONTEXT:
${decision.clarificationQuestions
  .slice(0, 10)
  .join("\n")}
`;

        break;

      case ResponseMode.EMERGENCY_WARNING_MODE:

        systemInstruction += `

CRITICAL MEDICAL SITUATION.

Advise immediate emergency medical attention.
`;

        break;
    }

    // -------------------------
    // MEMORY INJECTION
    // -------------------------

    const compactMemory =
      this.buildCompactMemory(
        updatedMemory
      );

    systemInstruction += `

CURRENT MEDICAL MEMORY:
${JSON.stringify(compactMemory)}
`;

    // -------------------------
    // GENERATE RESPONSE
    // -------------------------

    const text =
      await this.provider.generateText({

        model: modelName,

        systemInstruction,

        history: safeHistory,

        userInput: safeUserInput,

        imageParts
      });

    return {
      text,
      decision,
      updatedMemory
    };
  }
}