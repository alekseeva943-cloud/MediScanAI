// src/ai/interview/questionTopics.ts

// Semantic topic classifier.
//
// Нужен чтобы:
//
// - ловить повторы
// - ловить перефразированные вопросы
// - уменьшать AI loops
//
// Это НЕ medical reasoning.
// Это semantic grouping.

export type QuestionTopic =

  | "injury_mechanism"
  | "pain_character"
  | "pain_location"
  | "pain_severity"
  | "range_of_motion"
  | "swelling"
  | "bruising"
  | "numbness"
  | "breathing"
  | "bleeding"
  | "fever"
  | "duration"
  | "triggers"
  | "medications"
  | "red_flags"
  | "unknown";

// -----------------------------------
// HELPERS
// -----------------------------------

function containsAny(
  text: string,
  patterns: string[]
): boolean {

  return patterns.some(pattern =>
    text.includes(pattern)
  );
}

// -----------------------------------
// CLASSIFIER
// -----------------------------------

export function classifyQuestionTopic(
  text: string
): QuestionTopic {

  const normalized =
    text
      .toLowerCase()
      .trim();

  // -----------------------------------
  // INJURY
  // -----------------------------------

  if (

    containsAny(normalized, [

      "как удар",
      "как произош",
      "механизм",
      "удар о",
      "паден",
      "травм",
      "ушиб"

    ])

  ) {

    return "injury_mechanism";
  }

  // -----------------------------------
  // PAIN CHARACTER
  // -----------------------------------

  if (

    containsAny(normalized, [

      "характер боли",
      "какая боль",
      "острая",
      "тупая",
      "жгуч",
      "пульсир",
      "ноющая"

    ])

  ) {

    return "pain_character";
  }

  // -----------------------------------
  // PAIN LOCATION
  // -----------------------------------

  if (

    containsAny(normalized, [

      "где болит",
      "где именно",
      "локализация",
      "в каком месте"

    ])

  ) {

    return "pain_location";
  }

  // -----------------------------------
  // PAIN SEVERITY
  // -----------------------------------

  if (

    containsAny(normalized, [

      "насколько сильная",
      "сильная ли боль",
      "оцените боль",
      "боль от 1 до 10"

    ])

  ) {

    return "pain_severity";
  }

  // -----------------------------------
  // RANGE OF MOTION
  // -----------------------------------

  if (

    containsAny(normalized, [

      "поднять руку",
      "двигать",
      "ограничение движения",
      "можете двигать",
      "трудно двигать"

    ])

  ) {

    return "range_of_motion";
  }

  // -----------------------------------
  // SWELLING
  // -----------------------------------

  if (

    containsAny(normalized, [

      "отек",
      "опух",
      "припух"

    ])

  ) {

    return "swelling";
  }

  // -----------------------------------
  // BRUISING
  // -----------------------------------

  if (

    containsAny(normalized, [

      "синяк",
      "гематом"

    ])

  ) {

    return "bruising";
  }

  // -----------------------------------
  // NUMBNESS
  // -----------------------------------

  if (

    containsAny(normalized, [

      "онем",
      "покалыв",
      "чувствительность"

    ])

  ) {

    return "numbness";
  }

  // -----------------------------------
  // BREATHING
  // -----------------------------------

  if (

    containsAny(normalized, [

      "дыш",
      "одыш",
      "нехватка воздуха"

    ])

  ) {

    return "breathing";
  }

  // -----------------------------------
  // BLEEDING
  // -----------------------------------

  if (

    containsAny(normalized, [

      "кров",
      "кровотеч"

    ])

  ) {

    return "bleeding";
  }

  // -----------------------------------
  // FEVER
  // -----------------------------------

  if (

    containsAny(normalized, [

      "температ",
      "лихорад",
      "жар"

    ])

  ) {

    return "fever";
  }

  // -----------------------------------
  // DURATION
  // -----------------------------------

  if (

    containsAny(normalized, [

      "когда нач",
      "как давно",
      "сколько времени",
      "как долго",
      "давно ли"

    ])

  ) {

    return "duration";
  }

  // -----------------------------------
  // TRIGGERS
  // -----------------------------------

  if (

    containsAny(normalized, [

      "после чего",
      "что спровоцировало",
      "что ухудшает",
      "что усиливает"

    ])

  ) {

    return "triggers";
  }

  // -----------------------------------
  // MEDICATIONS
  // -----------------------------------

  if (

    containsAny(normalized, [

      "что принимали",
      "какие лекарства",
      "что помогает"

    ])

  ) {

    return "medications";
  }

  // -----------------------------------
  // RED FLAGS
  // -----------------------------------

  if (

    containsAny(normalized, [

      "теряли сознание",
      "сильная слабость",
      "судороги",
      "удушье"

    ])

  ) {

    return "red_flags";
  }

  return "unknown";
}