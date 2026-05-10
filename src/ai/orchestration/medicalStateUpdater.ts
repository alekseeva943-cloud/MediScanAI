// src/ai/orchestration/medicalStateUpdater.ts

import { OpenAIProvider } from "../providers/openaiProvider.js";

import type {

  AIMedicalUpdateResult,

  MedicalCaseUpdate,

  PatientProfileUpdate

} from "../types/index.js";

// -----------------------------------------------------
// MEDICAL STATE UPDATER
// -----------------------------------------------------

export class MedicalStateUpdater {

  private provider: OpenAIProvider;

  constructor(apiKey?: string) {

    const key =

      apiKey ||

      process.env.OPENAI_API_KEY ||

      '';

    this.provider =
      new OpenAIProvider(key);
  }

  // -----------------------------------------------------
  // BUILD PROMPT
  // -----------------------------------------------------

  private buildPrompt(

    userInput: string,

    patientProfile: any,

    activeCase: any

  ) {

    return `

You are a Medical State Extraction AI.

Your ONLY task:

Extract structured medical data updates.

You DO NOT answer the user.
You DO NOT explain anything.
You DO NOT give recommendations.
You DO NOT continue the interview.

You ONLY update structured medical state.

--------------------------------------------------

PATIENT PROFILE:

${JSON.stringify(patientProfile, null, 2)}

--------------------------------------------------

ACTIVE MEDICAL CASE:

${JSON.stringify(activeCase, null, 2)}

--------------------------------------------------

NEW USER MESSAGE:

${userInput}

--------------------------------------------------

RULES:

1. Extract ONLY medically relevant facts.

2. Separate:
- permanent patient data
- current case data

3. Permanent profile includes:
- allergies
- chronic diseases
- medications
- surgeries
- risk factors
- age
- sex

4. Current case includes:
- symptoms
- triggers
- red flags
- probable cause
- current risks

5. Do NOT hallucinate.

6. Do NOT invent diagnoses.

7. Keep arrays short and clean.

8. Return JSON ONLY.

--------------------------------------------------

JSON FORMAT:

{
  "patientProfileUpdates": {

    "allergies": [],

    "chronicConditions": [],

    "medications": [],

    "riskFactors": []
  },

  "medicalCaseUpdates": {

    "chiefComplaint": "",

    "confirmedSymptoms": [],

    "excludedSymptoms": [],

    "detectedTriggers": [],

    "possibleConditions": [],

    "redFlags": [],

    "dangerLevel": "low",

    "aiSummary": ""
  }
}
`;
  }

  // -----------------------------------------------------
  // SAFE JSON PARSE
  // -----------------------------------------------------

  private safeParse(
    text: string
  ) {

    try {

      const cleaned = text

        .replace(/```json/g, "")

        .replace(/```/g, "")

        .trim();

      return JSON.parse(cleaned);

    } catch (error) {

      console.error(
        "Medical state parse error:",
        error
      );

      return null;
    }
  }

  // -----------------------------------------------------
  // UPDATE STATE
  // -----------------------------------------------------

  async updateMedicalState(

    userInput: string,

    patientProfile: any,

    activeCase: any

  ): Promise<AIMedicalUpdateResult> {

    try {

      // --------------------------------------------------
      // PROMPT
      // --------------------------------------------------

      const prompt =
        this.buildPrompt(

          userInput,

          patientProfile,

          activeCase
        );

      // --------------------------------------------------
      // AI GENERATION
      // --------------------------------------------------

      const response =
        await this.provider.generateRouterDecision(
          prompt
        );

      // --------------------------------------------------
      // PARSE
      // --------------------------------------------------

      const parsed =
        this.safeParse(
          response
        );

      if (!parsed) {

        return {};
      }

      // --------------------------------------------------
      // NORMALIZE PROFILE
      // --------------------------------------------------

      const profileUpdates:
        PatientProfileUpdate = {

        firstName:
          parsed
            ?.patientProfileUpdates
            ?.firstName,

        lastName:
          parsed
            ?.patientProfileUpdates
            ?.lastName,

        age:
          parsed
            ?.patientProfileUpdates
            ?.age,

        gender:
          parsed
            ?.patientProfileUpdates
            ?.gender,

        allergies:

          Array.isArray(
            parsed
              ?.patientProfileUpdates
              ?.allergies
          )

            ? parsed
                .patientProfileUpdates
                .allergies

            : [],

        chronicConditions:

          Array.isArray(
            parsed
              ?.patientProfileUpdates
              ?.chronicConditions
          )

            ? parsed
                .patientProfileUpdates
                .chronicConditions

            : [],

        medications:

          Array.isArray(
            parsed
              ?.patientProfileUpdates
              ?.medications
          )

            ? parsed
                .patientProfileUpdates
                .medications

            : [],

        surgeries:

          Array.isArray(
            parsed
              ?.patientProfileUpdates
              ?.surgeries
          )

            ? parsed
                .patientProfileUpdates
                .surgeries

            : [],

        familyHistory:

          Array.isArray(
            parsed
              ?.patientProfileUpdates
              ?.familyHistory
          )

            ? parsed
                .patientProfileUpdates
                .familyHistory

            : [],

        riskFactors:

          Array.isArray(
            parsed
              ?.patientProfileUpdates
              ?.riskFactors
          )

            ? parsed
                .patientProfileUpdates
                .riskFactors

            : []
      };

      // --------------------------------------------------
      // NORMALIZE CASE
      // --------------------------------------------------

      const caseUpdates:
        MedicalCaseUpdate = {

        chiefComplaint:
          parsed
            ?.medicalCaseUpdates
            ?.chiefComplaint || "",

        probableCause:
          parsed
            ?.medicalCaseUpdates
            ?.probableCause || "",

        confirmedSymptoms:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.confirmedSymptoms
          )

            ? parsed
                .medicalCaseUpdates
                .confirmedSymptoms

            : [],

        excludedSymptoms:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.excludedSymptoms
          )

            ? parsed
                .medicalCaseUpdates
                .excludedSymptoms

            : [],

        detectedTriggers:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.detectedTriggers
          )

            ? parsed
                .medicalCaseUpdates
                .detectedTriggers

            : [],

        possibleConditions:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.possibleConditions
          )

            ? parsed
                .medicalCaseUpdates
                .possibleConditions

            : [],

        redFlags:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.redFlags
          )

            ? parsed
                .medicalCaseUpdates
                .redFlags

            : [],

        followUpQuestions:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.followUpQuestions
          )

            ? parsed
                .medicalCaseUpdates
                .followUpQuestions

            : [],

        recommendations:

          Array.isArray(
            parsed
              ?.medicalCaseUpdates
              ?.recommendations
          )

            ? parsed
                .medicalCaseUpdates
                .recommendations

            : [],

        aiSummary:
          parsed
            ?.medicalCaseUpdates
            ?.aiSummary || "",

        dangerLevel:

          parsed
            ?.medicalCaseUpdates
            ?.dangerLevel || "low",

        interviewCompleted:

          parsed
            ?.medicalCaseUpdates
            ?.interviewCompleted || false
      };

      // --------------------------------------------------
      // FINAL
      // --------------------------------------------------

      return {

        patientProfileUpdates:
          profileUpdates,

        medicalCaseUpdates:
          caseUpdates
      };

    } catch (error) {

      console.error(
        "Medical state updater error:",
        error
      );

      return {};
    }
  }
}