// src/ai/profile/profileUpdatePrompt.ts

// Prompt для обновления
// структурированного профиля пациента.
//
// GPT должен:
// - анализировать сообщение,
// - обновлять профиль,
// - сохранять старые данные,
// - возвращать только JSON.

export const PROFILE_UPDATE_PROMPT = `

You are updating a structured patient profile.

IMPORTANT:

- Return ONLY valid JSON.
- Never return explanations.
- Never return markdown.
- Never invent facts.
- Never erase valid old data.
- Update ONLY confirmed information.

-----------------------------------
PROFILE FIELD RULES
-----------------------------------

mainComplaint:
- Main reason for обращения.
- Short and clear.

Examples:
- "боль в плече"
- "кашель"
- "жжение в анусе"

-----------------------------------

symptoms:
- Additional symptoms.

Examples:
- "отек"
- "онемение"
- "температура"

-----------------------------------

pain.location:
- Where pain is located.

Examples:
- "плечо"
- "спина"
- "горло"

-----------------------------------

pain.character:
- Type of pain.

Examples:
- "тупая"
- "острая"
- "жгучая"
- "пульсирующая"

-----------------------------------

pain.duration:
- How long symptoms exist.

Examples:
- "2 дня"
- "неделю"
- "с утра"

-----------------------------------

trauma.exists:
- TRUE if user mentions:
  удар
  падение
  травма
  ушиб

-----------------------------------

trauma.mechanism:
- Short trauma explanation.

Examples:
- "удар о стену"
- "падение"

-----------------------------------

functionalLimitations:
- What user cannot do.

Examples:
- "не может поднять руку"
- "больно ходить"

-----------------------------------

possibleTriggers:
- Obvious triggers.

Examples:
- "острая еда"
- "травма"
- "переохлаждение"

-----------------------------------

medicationsTried:
- Medicines already used.

Examples:
- "ибупрофен"
- "мазь"

-----------------------------------

redFlags:
- Dangerous symptoms.

Examples:
- "кровь"
- "потеря сознания"
- "удушье"

-----------------------------------

resolvedTopics:
- Information already clarified.

Examples:
- "pain_character"
- "trauma"
- "pain_location"

-----------------------------------

missingTopics:
- Important missing information.

Examples:
- "отек"
- "онемение"

-----------------------------------
EXAMPLES
-----------------------------------

USER:
"У меня тупая боль в плече"

OUTPUT:

{
  "mainComplaint": "боль в плече",

  "pain": {
    "location": "плечо",
    "character": "тупая"
  },

  "resolvedTopics": [
    "pain_location",
    "pain_character"
  ]
}

-----------------------------------

USER:
"Я ударился о стену"

OUTPUT:

{
  "trauma": {
    "exists": true,
    "mechanism": "удар о стену"
  },

  "possibleTriggers": [
    "травма"
  ],

  "resolvedTopics": [
    "trauma"
  ]
}

-----------------------------------

USER:
"Не могу поднять руку"

OUTPUT:

{
  "functionalLimitations": [
    "не может поднять руку"
  ]
}

-----------------------------------

The profile is cumulative.

Keep old valid values.

Return JSON only.
`;