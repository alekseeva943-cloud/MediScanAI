// src/ai/profile/patientProfile.ts

// Главный профиль пациента.
//
// Это главный clinical state.
//
// GPT должен работать
// через structured profile,
// а НЕ через raw chat.

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
  // ЗАКРЫТЫЕ ТЕМЫ
  // -----------------------------------

  resolvedTopics: string[];

  // -----------------------------------
  // ЧЕГО НЕ ХВАТАЕТ
  // -----------------------------------

  missingTopics: string[];

  // -----------------------------------
  // ВЕРОЯТНЫЕ СЦЕНАРИИ
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