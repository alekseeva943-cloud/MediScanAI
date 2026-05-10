// src/ai/interview/buildDiagnosticState.ts

// Этот файл отвечает за создание структурированного
// диагностического состояния для AI.
//
// Главная задача:
//
// Превратить хаотичную medical memory
// в понятный clinical context.
//
// AI должен видеть:
//
// - что уже подтверждено,
// - что уже спрашивали,
// - чего НЕ хватает,
// - какие есть red flags,
// - какая главная жалоба.
//
// Это сильно уменьшает:
// - повторные вопросы,
// - зацикливание,
// - useless interview loops.

import type {
  MedicalMemory
} from "../types/index.js";

import type {
  InterviewState
} from "./buildInterviewState.js";

import type {
  PatientProfile
} from "../profile/patientProfile.js";

export interface DiagnosticState {

  primaryComplaint: string;

  confirmedFindings: string[];

  alreadyCovered: string[];

  missingInformation: string[];

  redFlags: string[];
}

function buildConfirmedFindings(
  profile: PatientProfile
): string[] {

  const findings: string[] = [];

  // -----------------------------------
  // MAIN COMPLAINT
  // -----------------------------------

  if (
    profile.mainComplaint
  ) {

    findings.push(
      `Главная жалоба: ${profile.mainComplaint}`
    );
  }

  // -----------------------------------
  // PAIN
  // -----------------------------------

  if (
    profile.pain.location
  ) {

    findings.push(
      `Локализация боли: ${profile.pain.location}`
    );
  }

  if (
    profile.pain.character
  ) {

    findings.push(
      `Характер боли: ${profile.pain.character}`
    );
  }

  if (
    profile.pain.duration
  ) {

    findings.push(
      `Длительность: ${profile.pain.duration}`
    );
  }

  // -----------------------------------
  // TRAUMA
  // -----------------------------------

  if (
    profile.trauma.exists
  ) {

    findings.push(
      "Была травма"
    );
  }

  if (
    profile.trauma.mechanism
  ) {

    findings.push(
      `Механизм травмы: ${profile.trauma.mechanism}`
    );
  }

  // -----------------------------------
  // LIMITATIONS
  // -----------------------------------

  findings.push(
    ...profile.functionalLimitations
  );

  // -----------------------------------
  // SYMPTOMS
  // -----------------------------------

  findings.push(
    ...profile.symptoms
  );

  return findings;
}

function buildMissingInformation(
  profile: PatientProfile
): string[] {

  const missing: string[] = [];

  // -----------------------------------
  // PAIN
  // -----------------------------------

  if (
    !profile.pain.character
  ) {

    missing.push(
      "характер боли"
    );
  }

  if (
    !profile.pain.location
  ) {

    missing.push(
      "локализация боли"
    );
  }

  // -----------------------------------
  // TRAUMA
  // -----------------------------------

  if (

    profile.mainComplaint
      .includes("боль")

    &&

    !profile.trauma.exists

  ) {

    missing.push(
      "наличие травмы"
    );
  }

  // -----------------------------------
  // SHOULDER / ARM
  // -----------------------------------

  const shoulderCase =

    profile.mainComplaint
      .toLowerCase()
      .includes("плеч");

  if (shoulderCase) {

    if (
      !profile.symptoms.includes(
        "отек"
      )
    ) {

      missing.push(
        "наличие отека"
      );
    }

    if (
      !profile.symptoms.includes(
        "онемение"
      )
    ) {

      missing.push(
        "наличие онемения"
      );
    }
  }

  return missing;
}

export function buildDiagnosticState(
  memory: MedicalMemory,
  interviewState: InterviewState
): DiagnosticState {

  const profile =

    memory.patientProfile;

  if (!profile) {

    return {

      primaryComplaint:
        "unknown complaint",

      confirmedFindings: [],

      alreadyCovered:
        interviewState.previousQuestions,

      missingInformation: [],

      redFlags: []
    };
  }

  return {

    primaryComplaint:
      profile.mainComplaint,

    confirmedFindings:
      buildConfirmedFindings(
        profile
      ),

    alreadyCovered:
      profile.resolvedTopics,

    missingInformation:
      buildMissingInformation(
        profile
      ),

    redFlags:
      profile.redFlags
  };
}