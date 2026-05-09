// src/ai/orchestration/medicalOrchestrator.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MedicalRouter } from "../router/medicalRouter";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt";
import { ANALYSIS_PROMPT } from "../prompts/analysisPrompt";
import { UPDATE_ANALYSIS_PROMPT } from "../prompts/updateAnalysisPrompt";
import { 
  ResponseMode, 
  MedicalMemory, 
  AnalysisSnapshot, 
  RouterDecision 
} from "../types";

export class MedicalOrchestrator {
  private genAI: GoogleGenerativeAI;
  private router: MedicalRouter;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(key);
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
    let modelName = "gemini-1.5-flash-8b"; // Default to fast model

    switch (decision.mode) {
      case ResponseMode.FULL_MEDICAL_ANALYSIS:
        systemInstruction += "\n" + ANALYSIS_PROMPT;
        modelName = "gemini-1.5-pro"; // Use stronger model for analysis
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

    const model = this.genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemInstruction 
    });

    const chat = model.startChat({
      history: history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessage([userInput, ...imageParts]);
    const response = await result.response;
    
    return {
      text: response.text(),
      decision
    };
  }
}
