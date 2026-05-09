// src/ai/router/medicalRouter.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RouterDecision, UserIntent, ResponseMode, MedicalMemory, AnalysisSnapshot } from "../types";

export class MedicalRouter {
  private model: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(key);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
  }

  async decide(
    userInput: string,
    history: any[],
    memory: MedicalMemory,
    lastAnalysis: AnalysisSnapshot | null
  ): Promise<RouterDecision> {
    const prompt = `
    You are a Medical AI Router. Your task is to analyze the user input and current state to determine the best response strategy.

    CURRENT STATE:
    - User Input: "${userInput}"
    - Medical Memory: ${JSON.stringify(memory)}
    - Has Last Analysis: ${!!lastAnalysis}

    RULES:
    1. Detect EMERGENCY: If the user describes life-threatening symptoms (chest pain, severe bleeding, difficulty breathing, etc.), set EMERGENCY_WARNING_MODE.
    2. Intent Classification:
       - CASUAL_CHAT: Greetings, how are you, etc.
       - SYMPTOM_ANALYSIS: Describing new symptoms.
       - MEDICATION_CHECK: Asking about drug compatibility or dosage.
       - DOCUMENT_ANALYSIS: Referring to uploaded results or images.
       - FOLLOW_UP: Asking questions about a previous analysis.
    3. Mode Selection:
       - If information is missing to provide a safe answer, use CLARIFICATION_MODE.
       - If it's a new complex request and we have enough data, use FULL_MEDICAL_ANALYSIS.
       - If it's a small update to existing data, use ANALYSIS_UPDATE_MODE.
       - Otherwise, use CASUAL_CONVERSATION or PRELIMINARY_ANALYSIS.

    Return ONLY a JSON object:
    {
      "intent": "UserIntent",
      "mode": "ResponseMode",
      "isAnalysisNeeded": boolean,
      "needsClarification": boolean,
      "clarificationQuestions": ["list of questions if needed"],
      "emergencyLevel": "low" | "medium" | "high",
      "isUpdateToExisting": boolean
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Extract JSON from response if it's wrapped in triple backticks
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Router error:", error);
      return {
        intent: UserIntent.CASUAL_CHAT,
        mode: ResponseMode.CASUAL_CONVERSATION,
        isAnalysisNeeded: false,
        needsClarification: false,
        clarificationQuestions: [],
        emergencyLevel: 'low',
        isUpdateToExisting: false
      };
    }
  }
}
