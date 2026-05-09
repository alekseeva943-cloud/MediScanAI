// src/ai/orchestration/medicalOrchestrator.ts
// ESM: keep explicit .js extensions for runtime imports after TypeScript transpilation.
import { OpenAIProvider } from "../providers/openaiProvider.js";
import { MedicalRouter } from "../router/medicalRouter.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";
import { ANALYSIS_PROMPT } from "../prompts/analysisPrompt.js";
import { UPDATE_ANALYSIS_PROMPT } from "../prompts/updateAnalysisPrompt.js";
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

  async processRequest(
    userInput: string,
    imageParts: any[],
    history: any[],
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ) {
    // 1. Route the request
    const decision: RouterDecision = await this.router.decide(
      userInput,
      history,
      memory,
      lastAnalysis
    );

    console.log("Orchestrator decision:", decision);

    // 2. Select strategy based on mode
    let systemInstruction = SYSTEM_PROMPT;
    let modelName: "gpt-4o-mini" | "gpt-4.1-mini" = "gpt-4o-mini"; // Default to fast model

    switch (decision.mode) {
      case ResponseMode.FULL_MEDICAL_ANALYSIS:
        systemInstruction += "\n" + ANALYSIS_PROMPT;
        modelName = "gpt-4.1-mini"; // Use stronger model for analysis
        break;
      case ResponseMode.ANALYSIS_UPDATE_MODE:
        systemInstruction += "\n" + UPDATE_ANALYSIS_PROMPT;
        systemInstruction += `\nПРЕДЫДУЩИЙ АНАЛИЗ ДЛЯ СПРАВКИ: ${JSON.stringify(lastAnalysis)}`;
        break;
      case ResponseMode.CLARIFICATION_MODE:
        systemInstruction += "\nВы находитесь в режиме уточнения данных. Задайте пользователю следующие вопросы: " + decision.clarificationQuestions.join(", ");
        break;
      case ResponseMode.EMERGENCY_WARNING_MODE:
        systemInstruction += "\nКРИТИЧЕСКАЯ СИТУАЦИЯ. Начните ответ с немедленного предупреждения о необходимости скорой помощи.";
        break;
    }

    const text = await this.provider.generateText({
      model: modelName,
      systemInstruction,
      history,
      userInput,
      imageParts
    });

    return {
      text,
      decision
    };
  }
}
