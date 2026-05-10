// src/ai/profile/updatePatientProfile.ts

// Этот файл отвечает за обновление
// профиля пациента через GPT.
//
// ВАЖНО:
//
// GPT может забывать некоторые поля.
// Поэтому backend дополнительно
// нормализует и стабилизирует profile.

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

// -----------------------------------
// NORMALIZE PROFILE
// -----------------------------------

function normalizeProfile(
  profile: PatientProfile
): PatientProfile {

  const resolvedTopics =
    new Set(
      profile.resolvedTopics
    );

  // -----------------------------------
  // PAIN
  // -----------------------------------

  if (
    profile.pain.character
  ) {

    resolvedTopics.add(
      "pain_character"
    );
  }

  if (
    profile.pain.location
  ) {

    resolvedTopics.add(
      "pain_location"
    );
  }

  if (
    profile.pain.duration
  ) {

    resolvedTopics.add(
      "pain_duration"
    );
  }

  // -----------------------------------
  // TRAUMA
  // -----------------------------------

  if (
    profile.trauma.exists
  ) {

    resolvedTopics.add(
      "trauma"
    );
  }

  // -----------------------------------
  // NEGATIVE FINDINGS
  // -----------------------------------

  if (

    profile.negativeFindings
      .includes("отек")

  ) {

    resolvedTopics.add(
      "swelling"
    );
  }

  if (

    profile.negativeFindings
      .includes("онемение")

  ) {

    resolvedTopics.add(
      "numbness"
    );
  }

  profile.resolvedTopics =
    Array.from(
      resolvedTopics
    );

  return profile;
}

export class PatientProfileUpdater {

  private provider:
    OpenAIProvider;

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

      const normalizedProfile =

        normalizeProfile(
          mergedProfile
        );

      console.log(
        "Normalized profile:",
        normalizedProfile
      );

      return normalizedProfile;

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      return currentProfile;
    }
  }
}