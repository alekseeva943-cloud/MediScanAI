// src/ai/interview/questionTopics.ts

// Этот файл отвечает за определение
// смысловой темы медицинского вопроса.
//
// GPT может задавать один и тот же вопрос
// разными словами.
//
// Например:
//
// - "Как именно вы ударились?"
// - "Это был удар о предмет?"
// - "Как произошла травма?"
//
// Всё это:
//
// injury_mechanism
//
// Это нужно чтобы:
// - избегать повторов,
// - контролировать interview flow,
// - строить нормальный diagnostic engine.

export type QuestionTopic =

  | "injury_mechanism"
  | "pain_character"
  | "pain_location"
  | "range_of_motion"
  | "swelling"
  | "bruising"
  | "numbness"
  | "breathing"
  | "bleeding"
  | "fever"
  | "duration"
  | "unknown";

export function classifyQuestionTopic(
  text: string
): QuestionTopic {

  const normalized =
    text.toLowerCase();

  // -----------------------------------
  // INJURY
  // -----------------------------------

  if (

    normalized.includes("как удар")
    ||

    normalized.includes("как произош")

    ||

    normalized.includes("механизм")

    ||

    normalized.includes("удар о")

    ||

    normalized.includes("паден")

  ) {

    return "injury_mechanism";
  }

  // -----------------------------------
  // PAIN CHARACTER
  // -----------------------------------

  if (

    normalized.includes("острая")

    ||

    normalized.includes("тупая")

    ||

    normalized.includes("пульсир")

    ||

    normalized.includes("характер боли")

  ) {

    return "pain_character";
  }

  // -----------------------------------
  // RANGE OF MOTION
  // -----------------------------------

  if (

    normalized.includes("поднять руку")

    ||

    normalized.includes("двигать")

    ||

    normalized.includes("ограничение движения")

  ) {

    return "range_of_motion";
  }

  // -----------------------------------
  // SWELLING
  // -----------------------------------

  if (

    normalized.includes("отек")

    ||

    normalized.includes("опух")

  ) {

    return "swelling";
  }

  // -----------------------------------
  // BRUISING
  // -----------------------------------

  if (

    normalized.includes("синяк")

    ||

    normalized.includes("гематом")

  ) {

    return "bruising";
  }

  // -----------------------------------
  // NUMBNESS
  // -----------------------------------

  if (

    normalized.includes("онем")

  ) {

    return "numbness";
  }

  // -----------------------------------
  // BREATHING
  // -----------------------------------

  if (

    normalized.includes("дыш")

  ) {

    return "breathing";
  }

  // -----------------------------------
  // BLEEDING
  // -----------------------------------

  if (

    normalized.includes("кров")

  ) {

    return "bleeding";
  }

  // -----------------------------------
  // FEVER
  // -----------------------------------

  if (

    normalized.includes("температ")

    ||

    normalized.includes("лихорад")

  ) {

    return "fever";
  }

  // -----------------------------------
  // DURATION
  // -----------------------------------

  if (

    normalized.includes("когда нач")

    ||

    normalized.includes("как давно")

    ||

    normalized.includes("сколько времени")

  ) {

    return "duration";
  }

  return "unknown";
}