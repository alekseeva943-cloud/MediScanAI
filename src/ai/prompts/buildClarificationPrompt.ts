// src/ai/prompts/buildClarificationPrompt.ts

// Этот файл отвечает за создание prompt
// для режима уточняющих медицинских вопросов.
//
// Здесь AI получает:
// - structured diagnostic state,
// - уже известные факты,
// - уже покрытые темы,
// - missing information,
// - red flags.
//
// Главная задача:
// задавать только ОДИН полезный вопрос
// и не повторяться.

import type {
  DiagnosticState
} from "../interview/buildDiagnosticState.js";

export function buildClarificationPrompt(
  diagnosticState: DiagnosticState
): string {

  return `

You are now in SMART MEDICAL TRIAGE MODE.

CRITICAL RULES:

- Ask ONLY ONE short clinically useful question.
- NEVER repeat already covered topics.
- NEVER ask the same thing differently.
- NEVER ask generic filler questions.
- NEVER prolong the interview unnecessarily.
- Focus ONLY on missing critical information.

INTERVIEW PRIORITY:

1. Exclude dangerous conditions
2. Confirm obvious diagnosis
3. Identify red flags
4. Finish interview quickly

VERY IMPORTANT:

The user HATES long useless interviews.

DO NOT repeat:
- mechanism questions
- pain questions
- already answered topics

PRIMARY COMPLAINT:
${diagnosticState.primaryComplaint}

CONFIRMED FINDINGS:
${diagnosticState.confirmedFindings
  .map((f) => `- ${f}`)
  .join("\n")}

ALREADY COVERED:
${diagnosticState.alreadyCovered
  .map((q) => `- ${q}`)
  .join("\n")}

MISSING INFORMATION:
${diagnosticState.missingInformation
  .map((m) => `- ${m}`)
  .join("\n")}

RED FLAGS:
${diagnosticState.redFlags
  .map((r) => `- ${r}`)
  .join("\n")}

IF:
- danger is low
- diagnosis is already obvious
- enough information is collected

THEN:
finish interview immediately.

RETURN ONLY JSON.

QUESTION FORMAT:

{
  "type": "question",
  "summary": "question",
  "quick_replies": [
    "option 1",
    "option 2",
    "Пропустить"
  ],
  "interviewCompleted": false
}

FINAL FORMAT:

{
  "type": "final",
  "summary": "short medical conclusion",
  "interviewCompleted": true
}
`;
}