// src/ai/interview/buildDiagnosticState.ts

// Этот файл собирает
// структурированное диагностическое состояние.
//
// ВАЖНО:
//
// Здесь НЕ должно быть:
// - medical reasoning
// - disease logic
// - symptom hardcode
// - diagnosis logic
//
// Этот файл только:
//
// - собирает confirmed findings
// - собирает negative findings
// - передает profile в GPT
//
// GPT сам решает:
// - чего не хватает
// - что спрашивать
// - что уже достаточно уточнено

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

  // -----------------------------------
  // ADDITIONAL FINDINGS
  // -----------------------------------

  findings.push(
    ...(profile.additionalFindings || [])
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
        interviewState.previousQuestions,

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
      interviewState.previousQuestions || [],

    redFlags:
      profile.redFlags || []
  };
}