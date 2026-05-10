// src/ai/profile/patientProfile.ts

// Главный clinical profile пациента.
//
// Это основной state,
// через который работает AI.
//
// ВАЖНО:
//
// Profile должен:
//
// - хранить confirmed findings
// - хранить negative findings
// - хранить resolved topics
// - хранить missing topics
// - предотвращать циклы interview

export interface PatientProfile {

  // -----------------------------------
  // MAIN COMPLAINT
  // -----------------------------------

  mainComplaint: string;

  // -----------------------------------
  // SYMPTOMS
  // -----------------------------------

  symptoms: string[];

  // -----------------------------------
  // NEGATIVE FINDINGS
  // -----------------------------------

  negativeFindings: string[];

  // -----------------------------------
  // PAIN
  // -----------------------------------

  pain: {

    location: string;

    character: string;

    severity: string;

    duration: string;
  };

  // -----------------------------------
  // TRAUMA
  // -----------------------------------

  trauma: {

    exists: boolean;

    mechanism: string;
  };

  // -----------------------------------
  // FUNCTIONAL LIMITATIONS
  // -----------------------------------

  functionalLimitations: string[];

  // -----------------------------------
  // POSSIBLE TRIGGERS
  // -----------------------------------

  possibleTriggers: string[];

  // -----------------------------------
  // TREATMENTS
  // -----------------------------------

  treatmentsTried: string[];

  medicationsTried: string[];

  // -----------------------------------
  // RED FLAGS
  // -----------------------------------

  redFlags: string[];

  // -----------------------------------
  // RESOLVED TOPICS
  // -----------------------------------

  resolvedTopics: string[];

  // -----------------------------------
  // MISSING TOPICS
  // -----------------------------------

  missingTopics: string[];

  // -----------------------------------
  // LIKELY SCENARIOS
  // -----------------------------------

  likelyScenarios: string[];

  excludedScenarios: string[];
}

// -----------------------------------
// EMPTY PROFILE
// -----------------------------------

export const EMPTY_PATIENT_PROFILE:
  PatientProfile = {

    mainComplaint: "",

    symptoms: [],

    negativeFindings: [],

    pain: {

      location: "",

      character: "",

      severity: "",

      duration: ""
    },

    trauma: {

      exists: false,

      mechanism: ""
    },

    functionalLimitations: [],

    possibleTriggers: [],

    treatmentsTried: [],

    medicationsTried: [],

    redFlags: [],

    resolvedTopics: [],

    missingTopics: [],

    likelyScenarios: [],

    excludedScenarios: []
  };