// src/ai/orchestration/medicalOrchestrator.ts

import { OpenAIProvider } from "../providers/openaiProvider.js";

import { MedicalRouter } from "../router/medicalRouter.js";

import { MedicalStateUpdater } from "./medicalStateUpdater.js";

import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

import { ANALYSIS_PROMPT } from "../prompts/analysisPrompt.js";

import { UPDATE_ANALYSIS_PROMPT } from "../prompts/updateAnalysisPrompt.js";

import { MEMORY_EXTRACTION_PROMPT } from "../prompts/memoryExtractionPrompt.js";

import { ResponseMode } from "../types/index.js";

import type {

  MedicalMemory,

  AnalysisSnapshot,

  RouterDecision,

  AIMedicalUpdateResult

} from "../types/index.js";

export class MedicalOrchestrator {

  private provider: OpenAIProvider;

  private router: MedicalRouter;

  private stateUpdater: MedicalStateUpdater;

  constructor(apiKey?: string) {

    const key =
      apiKey ||
      process.env.OPENAI_API_KEY ||
      '';

    this.provider =
      new OpenAIProvider(key);

    this.router =
      new MedicalRouter(key);

    this.stateUpdater =
      new MedicalStateUpdater(key);
  }

  // -----------------------------------
  // COMPACT MEMORY
  // -----------------------------------

  private buildCompactMemory(
    memory: MedicalMemory
  ) {

    return {

      symptoms:
        memory.symptoms.slice(-15),

      medications:
        memory.medications.slice(-10),

      diagnoses:
        memory.diagnoses.slice(-10),

      allergies:
        memory.allergies.slice(-10),

      riskFactors:
        memory.riskFactors.slice(-10),

      extractedFacts:
        memory.extractedFacts.slice(-20),

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
  // BUILD INTERVIEW STATE
  // -----------------------------------

  private buildInterviewState(
    history: any[],
    memory: MedicalMemory
  ) {

    const assistantMessages =
      history.filter(
        (m) => m.role === "assistant"
      );

    const clarificationCount =
      assistantMessages.length;

    const previousQuestions =
      assistantMessages
        .map((m) => {

          try {

            const parsed =
              JSON.parse(m.content);

            return parsed?.text || "";

          } catch {

            return m.content || "";
          }

        })
        .filter(Boolean)
        .slice(-12);

    const extractedFacts =
      memory.extractedFacts || [];

    const joinedFacts =
      extractedFacts
        .join(" ")
        .toLowerCase();

    const obviousFoodIrritation =

      (
        joinedFacts.includes("остр")
        ||
        joinedFacts.includes("халапеньо")
        ||
        joinedFacts.includes("шаурм")
      )

      &&

      (
        joinedFacts.includes("жжение")
        ||
        joinedFacts.includes("зуд")
      )

      &&

      !joinedFacts.includes("кров")
      &&
      !joinedFacts.includes("температ")
      &&
      !joinedFacts.includes("рвот")
      &&
      !joinedFacts.includes("сильная боль");

    const probableFishScratch =

      (
        joinedFacts.includes("косточ")
        ||
        joinedFacts.includes("рыб")
      )

      &&

      (
        joinedFacts.includes("глот")
        ||
        joinedFacts.includes("горл")
      )

      &&

      !joinedFacts.includes("удуш")
      &&
      !joinedFacts.includes("не могу дышать")
      &&
      !joinedFacts.includes("кров")
      &&
      !joinedFacts.includes("температ");

    let confidence:
      "low" |
      "medium" |
      "high" = "low";

    if (
      obviousFoodIrritation
      ||
      probableFishScratch
    ) {

      confidence = "high";

    } else if (
      extractedFacts.length >= 4
    ) {

      confidence = "medium";
    }

    const shouldFinishInterview =

      confidence === "high"

      ||

      clarificationCount >= 6;

    return {

      clarificationCount,

      previousQuestions,

      confidence,

      shouldFinishInterview,

      obviousFoodIrritation,

      probableFishScratch
    };
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
      history.slice(-10);

    // -----------------------------------
    // AI STATE UPDATE
    // -----------------------------------

    let medicalStateUpdates:
      AIMedicalUpdateResult = {};

    try {

      medicalStateUpdates =

        await this.stateUpdater
          .updateMedicalState(

            safeUserInput,

            memory,

            lastAnalysis
          );

      console.log(
        "Medical state updates:",
        medicalStateUpdates
      );

    } catch (error) {

      console.error(
        "Medical updater failed:",
        error
      );
    }

    // -----------------------------------
    // INTERVIEW STATE
    // -----------------------------------

    const interviewState =
      this.buildInterviewState(
        safeHistory,
        memory
      );

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

    console.log(
      "Interview state:",
      interviewState
    );

    // -----------------------------------
    // FORCE FINISH
    // -----------------------------------

    if (

      decision.mode ===
      ResponseMode.CLARIFICATION_MODE

      &&

      interviewState.shouldFinishInterview

    ) {

      decision.mode =
        ResponseMode.FULL_MEDICAL_ANALYSIS;

      decision.interviewCompleted =
        true;
    }

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

          ...(extractedMemory.extractedFacts || []),

          safeUserInput
        ])

      ].slice(-40),

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

    switch (decision.mode) {

      case ResponseMode.FULL_MEDICAL_ANALYSIS:

        systemInstruction +=
          "\n" + ANALYSIS_PROMPT;

        modelName =
          "gpt-4.1-mini";

        systemInstruction += `

IMPORTANT:

- Stop asking questions.
- The interview is already sufficient.
- Give a concise medical assessment.
- Explain the MOST LIKELY cause.
- Give practical recommendations.
- Mention red flags ONLY if relevant.
- Behave like an experienced doctor.

IMPORTANT:
Do NOT continue the interview.
`;

        break;

      case ResponseMode.ANALYSIS_UPDATE_MODE:

        systemInstruction +=
          "\n" + UPDATE_ANALYSIS_PROMPT;

        break;

      case ResponseMode.CLARIFICATION_MODE:

        systemInstruction += `

You are now in SMART MEDICAL TRIAGE MODE.

CRITICAL RULES:

- Ask ONLY ONE short question.
- NEVER repeat questions.
- NEVER ask the same thing differently.
- NEVER ask generic filler questions.
- NEVER prolong the interview unnecessarily.
- If the probable cause is already obvious:
  STOP THE INTERVIEW.

INTERVIEW PRIORITY:

1. Exclude dangerous conditions
2. Identify obvious trigger
3. Confirm low-risk scenario
4. Finish interview quickly

VERY IMPORTANT:

The user HATES long useless interviews.

DO NOT ask more than needed.

CURRENT INTERVIEW STATE:
${JSON.stringify(interviewState)}

PREVIOUS QUESTIONS:
${JSON.stringify(interviewState.previousQuestions)}

KNOWN FACTS:
${JSON.stringify(updatedMemory.extractedFacts)}

IF:
- symptoms are obvious
- danger is low
- trigger is known
- no red flags

THEN:
finish interview immediately.

RETURN ONLY JSON.

FORMAT:

{
  "summary": "question",
  "quick_replies": [
    "option 1",
    "option 2",
    "Пропустить"
  ],
  "interviewCompleted": false
}
`;

        break;

      case ResponseMode.EMERGENCY_WARNING_MODE:

        systemInstruction += `

Emergency mode.

Advise urgent medical attention.

RETURN JSON ONLY.
`;

        break;
    }

    // -----------------------------------
    // MEMORY
    // -----------------------------------

    const compactMemory =
      this.buildCompactMemory(
        updatedMemory
      );

    systemInstruction += `

CURRENT MEDICAL MEMORY:
${JSON.stringify(compactMemory)}

MEDICAL STATE UPDATES:
${JSON.stringify(medicalStateUpdates)}
`;

    // -----------------------------------
    // GENERATE
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
    // PARSE
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
    // NORMALIZE
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

          : [],

      danger_level:

        parsedInterview?.danger_level

        ||

        decision?.emergencyLevel

        ||

        "low",

      interviewCompleted:

        parsedInterview
          ?.interviewCompleted

        ||

        decision?.interviewCompleted

        ||

        false
    };

    // -----------------------------------
    // SNAPSHOT
    // -----------------------------------

    const snapshot = {

      ...normalizedResponse,

      confidence:
        interviewState.confidence,

      timestamp:
        Date.now()
    };

    // -----------------------------------
    // FINAL
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
        normalizedResponse,


    };
  }
}