// src/ai/interview/buildDiagnosticState.ts

// Этот файл собирает
// structured diagnostic state.
//
// ВАЖНО:
//
// Здесь НЕ должно быть:
// - diagnosis logic
// - disease reasoning
// - symptom hardcode
// - medical decision making
//
// Этот файл только:
// - собирает confirmed findings
// - собирает negative findings
// - передает profile дальше

import type {
  MedicalMemory
} from "../types/index.js";

import type {
  InterviewState
} from "./buildInterviewState.js";

import type {
  PatientProfile
} from "../profile/patientProfile.js";

// -----------------------------------
// DIAGNOSTIC STATE
// -----------------------------------

export interface DiagnosticState {

  primaryComplaint: string;

  confirmedFindings: string[];

  negativeFindings: string[];

  alreadyCovered: string[];

  redFlags: string[];
}

// -----------------------------------
// CONFIRMED FINDINGS
// -----------------------------------

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
  // SYMPTOMS
  // -----------------------------------

  findings.push(
    ...(profile.symptoms || [])
  );

  // -----------------------------------
  // PAIN
  // -----------------------------------

  if (
    profile.pain?.location
  ) {

    findings.push(
      `Локализация боли: ${profile.pain.location}`
    );
  }

  if (
    profile.pain?.character
  ) {

    findings.push(
      `Характер боли: ${profile.pain.character}`
    );
  }

  if (
    profile.pain?.severity
  ) {

    findings.push(
      `Интенсивность боли: ${profile.pain.severity}`
    );
  }

  if (
    profile.pain?.duration
  ) {

    findings.push(
      `Длительность: ${profile.pain.duration}`
    );
  }

  // -----------------------------------
  // TRAUMA
  // -----------------------------------

  if (
    profile.trauma?.exists
  ) {

    findings.push(
      "Была травма"
    );
  }

  if (
    profile.trauma?.mechanism
  ) {

    findings.push(
      `Механизм травмы: ${profile.trauma.mechanism}`
    );
  }

  // -----------------------------------
  // FUNCTIONAL LIMITATIONS
  // -----------------------------------

  findings.push(
    ...(profile.functionalLimitations || [])
  );

  // -----------------------------------
  // TRIGGERS
  // -----------------------------------

  findings.push(
    ...(profile.possibleTriggers || [])
  );

  return findings;
}

// -----------------------------------
// BUILD DIAGNOSTIC STATE
// -----------------------------------

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

      negativeFindings: [],

      alreadyCovered:
        interviewState.previousQuestions || [],

      redFlags: []
    };
  }

  return {

    primaryComplaint:
      profile.mainComplaint || "",

    confirmedFindings:
      buildConfirmedFindings(
        profile
      ),

    negativeFindings:
      profile.negativeFindings || [],

    alreadyCovered:
      profile.resolvedTopics || [],

    redFlags:
      profile.redFlags || []
  };
}