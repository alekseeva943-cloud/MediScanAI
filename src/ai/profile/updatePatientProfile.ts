// src/ai/profile/updatePatientProfile.ts

// Этот файл отвечает за обновление
// профиля пациента через GPT.

import { OpenAIProvider }
  from "../providers/openaiProvider.js";

import type {
  PatientProfile
} from "./patientProfile.js";

import {
  PROFILE_UPDATE_PROMPT
} from "./profileUpdatePrompt.js";

// -----------------------------------
// DEEP MERGE
// -----------------------------------

function deepMerge(
  target: any,
  source: any
): any {

  const output = {
    ...target
  };

  if (
    typeof target !== "object"
    ||
    typeof source !== "object"
  ) {

    return source;
  }

  Object.keys(source).forEach((key) => {

    const sourceValue =
      source[key];

    const targetValue =
      target[key];

    // -----------------------------------
    // ARRAYS
    // -----------------------------------

    if (
      Array.isArray(sourceValue)
    ) {

      output[key] = [

        ...new Set([

          ...(Array.isArray(targetValue)
            ? targetValue
            : []),

          ...sourceValue
        ])
      ];

      return;
    }

    // -----------------------------------
    // OBJECTS
    // -----------------------------------

    if (

      sourceValue

      &&

      typeof sourceValue ===
      "object"

    ) {

      output[key] =
        deepMerge(
          targetValue || {},
          sourceValue
        );

      return;
    }

    // -----------------------------------
    // PRIMITIVES
    // -----------------------------------

    if (

      sourceValue !== undefined

      &&

      sourceValue !== null

      &&

      sourceValue !== ""

    ) {

      output[key] =
        sourceValue;
    }
  });

  return output;
}

export class PatientProfileUpdater {

  private provider: OpenAIProvider;

  constructor(apiKey: string) {

    this.provider =
      new OpenAIProvider(apiKey);
  }

  async updateProfile(
    currentProfile: PatientProfile,
    userMessage: string
  ): Promise<PatientProfile> {

    try {

      const prompt = `

${PROFILE_UPDATE_PROMPT}

CURRENT PROFILE:
${JSON.stringify(
  currentProfile,
  null,
  2
)}

NEW USER MESSAGE:
${userMessage}

Return ONLY profile update JSON.
`;

      const response =
        await this.provider
          .generateRouterDecision(
            prompt
          );

      const cleaned =
        response

          .replace(/```json/g, "")

          .replace(/```/g, "")

          .trim();

      const partialUpdate =
        JSON.parse(cleaned);

      const mergedProfile =
        deepMerge(
          currentProfile,
          partialUpdate
        );

      return mergedProfile;

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      return currentProfile;
    }
  }
}