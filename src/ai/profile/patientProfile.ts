// src/ai/profile/patientProfile.ts

// Главный structured clinical profile.
//
// Здесь хранятся ТОЛЬКО факты.
//
// ВАЖНО:
//
// Никакой interview logic.
// Никаких AI conclusions.
// Никаких dynamic assumptions.
//
// Только clinical facts.

export interface PatientProfile {

  // -----------------------------------
  // ОСНОВНАЯ ЖАЛОБА
  // -----------------------------------

  mainComplaint: string;

  // -----------------------------------
  // СИМПТОМЫ
  // -----------------------------------

  symptoms: string[];

  // -----------------------------------
  // ОТРИЦАТЕЛЬНЫЕ СИМПТОМЫ
  // -----------------------------------

  negativeFindings: string[];

  // -----------------------------------
  // БОЛЬ
  // -----------------------------------

  pain: {

    location: string;

    character: string;

    severity: string;

    duration: string;
  };

  // -----------------------------------
  // ТРАВМА
  // -----------------------------------

  trauma: {

    exists: boolean;

    mechanism: string;
  };

  // -----------------------------------
  // ОГРАНИЧЕНИЯ
  // -----------------------------------

  functionalLimitations: string[];

  // -----------------------------------
  // ТРИГГЕРЫ
  // -----------------------------------

  possibleTriggers: string[];

  // -----------------------------------
  // ЛЕЧЕНИЕ
  // -----------------------------------

  treatmentsTried: string[];

  medicationsTried: string[];

  // -----------------------------------
  // RED FLAGS
  // -----------------------------------

  redFlags: string[];

  // -----------------------------------
  // ДОПОЛНИТЕЛЬНЫЕ КЛИНИЧЕСКИЕ ФАКТЫ
  // -----------------------------------

  additionalFindings: string[];
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

    additionalFindings: []
  };