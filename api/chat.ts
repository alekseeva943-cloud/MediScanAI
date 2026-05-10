// api/chat.ts

import type {

  VercelRequest,

  VercelResponse

} from '@vercel/node';

import type {

  MedicalCase,

  PatientProfile

} from '../src/types';

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

function safeArray(
  value: any
): string[] {

  return Array.isArray(value)
    ? value
    : [];
}

// -----------------------------------------------------
// PATIENT SUMMARY
// -----------------------------------------------------

function buildPatientSummary(
  profile?: PatientProfile | null
) {

  if (!profile) {
    return '';
  }

  return `

PATIENT PROFILE:

Имя:
${profile.firstName || 'Не указано'}

Возраст:
${profile.age || 'Не указан'}

Пол:
${profile.gender || 'Не указан'}

Аллергии:
${safeArray(profile.allergies).join(', ') || 'Нет данных'}

Хронические заболевания:
${safeArray(profile.chronicConditions).join(', ') || 'Нет данных'}

Лекарства:
${safeArray(profile.medications).join(', ') || 'Нет данных'}

Операции:
${safeArray(profile.surgeries).join(', ') || 'Нет данных'}

Факторы риска:
${safeArray(profile.riskFactors).join(', ') || 'Нет данных'}
`;
}

// -----------------------------------------------------
// CASE SUMMARY
// -----------------------------------------------------

function buildCaseSummary(
  medicalCase?: MedicalCase | null
) {

  if (!medicalCase) {
    return '';
  }

  return `

ACTIVE MEDICAL CASE:

Главная жалоба:
${medicalCase.chiefComplaint || 'Не указана'}

Симптомы:
${safeArray(medicalCase.symptoms).join(', ') || 'Нет'}

Подтвержденные симптомы:
${safeArray(medicalCase.confirmedSymptoms).join(', ') || 'Нет'}

Исключенные симптомы:
${safeArray(medicalCase.excludedSymptoms).join(', ') || 'Нет'}

Триггеры:
${safeArray(medicalCase.detectedTriggers).join(', ') || 'Нет'}

Вероятные состояния:
${safeArray(medicalCase.possibleConditions).join(', ') || 'Нет'}

Красные флаги:
${safeArray(medicalCase.redFlags).join(', ') || 'Нет'}

Уровень риска:
${medicalCase.dangerLevel || 'low'}

AI Summary:
${medicalCase.aiSummary || 'Нет'}
`;
}

// -----------------------------------------------------
// HANDLER
// -----------------------------------------------------

export default async function handler(

  req: VercelRequest,

  res: VercelResponse

) {

  if (req.method !== 'POST') {

    return res.status(405).json({

      error:
        'Метод не поддерживается'
    });
  }

  try {

    // -----------------------------------------------------
    // BODY
    // -----------------------------------------------------

    const {

      messages,

      patientProfile,

      activeCase,

      lastAnalysis

    } = req.body;

    // -----------------------------------------------------
    // SAFE MESSAGES
    // -----------------------------------------------------

    const safeMessages =
      Array.isArray(messages)
        ? messages
        : [];

    const lastMessage =
      safeMessages[
      safeMessages.length - 1
      ];

    if (!lastMessage) {

      return res.status(400).json({

        error:
          'Нет сообщения пользователя'
      });
    }

    // -----------------------------------------------------
    // USER INPUT
    // -----------------------------------------------------

    let userInput = '';

    if (
      typeof lastMessage.content
      === 'string'
    ) {

      userInput =
        lastMessage.content;
    }

    // -----------------------------------------------------
    // IMAGE EXTRACTION
    // -----------------------------------------------------

    const imageParts: any[] = [];

    if (
      Array.isArray(
        lastMessage.content
      )
    ) {

      lastMessage.content.forEach(
        (part: any) => {

          if (

            part?.type === 'image_url'

            &&

            part?.image_url?.url

          ) {

            const url =
              part.image_url.url;

            const matches =
              url.match(
                /^data:(.*?);base64,(.*)$/
              );

            if (!matches) {
              return;
            }

            const mimeType =
              matches[1];

            const base64Data =
              matches[2];

            imageParts.push({

              inlineData: {

                data:
                  base64Data,

                mimeType
              }
            });
          }
        }
      );
    }

    // -----------------------------------------------------
    // MEDICAL CONTEXT
    // -----------------------------------------------------

    const patientSummary =
      buildPatientSummary(
        patientProfile
      );

    const caseSummary =
      buildCaseSummary(
        activeCase
      );

    const recentConversation =
      safeMessages
        .slice(-4)
        .map((m: any) =>

          `${m.role}: ${typeof m.content === 'string'

            ? m.content

            : JSON.stringify(m.content)
          }`
        )
        .join('\n');

    const medicalContext = `

${patientSummary}

${caseSummary}

RECENT CONVERSATION:

${recentConversation}
`;

    // -----------------------------------------------------
    // ORCHESTRATOR
    // -----------------------------------------------------

    const {
      MedicalOrchestrator
    } = await import(
      '../src/ai/orchestration/medicalOrchestrator.js'
    );

    const orchestrator =
      new MedicalOrchestrator();

    // -----------------------------------------------------
    // MEMORY
    // -----------------------------------------------------

    const safeMemory = {
      
      patientProfile:
        patientProfile || {},

      symptoms:
        safeArray(activeCase?.symptoms),

      medications:
        safeArray(patientProfile?.medications),

      diagnoses:
        safeArray(activeCase?.possibleConditions),

      allergies:
        safeArray(patientProfile?.allergies),

      riskFactors:
        safeArray(patientProfile?.riskFactors),

      uploadedDocuments: [],

      extractedFacts:
        safeArray(activeCase?.timeline),

      chronicConditions:
        safeArray(patientProfile?.chronicConditions),

      surgeries:
        safeArray(patientProfile?.surgeries),

      familyHistory:
        safeArray(patientProfile?.familyHistory),

      age:
        patientProfile?.age || '',

      sex:
        patientProfile?.gender || ''
    };

    // -----------------------------------------------------
    // PROCESS AI
    // -----------------------------------------------------

    const result =
      await orchestrator.processRequest(

        userInput,

        imageParts,

        [
          {
            role: 'system',
            content: medicalContext
          }
        ],

        safeMemory,

        lastAnalysis || null
      );

    // -----------------------------------------------------
    // SAFE JSON PARSE
    // -----------------------------------------------------

    let parsedResponse: any = null;

    try {

      if (

        typeof result?.text === 'string'

        &&

        result.text
          .trim()
          .startsWith('{')

      ) {

        parsedResponse =
          JSON.parse(
            result.text
          );
      }

    } catch (err) {

      console.error(
        'JSON parse failed:',
        err
      );
    }

    // -----------------------------------------------------
    // FINAL TEXT
    // -----------------------------------------------------

    const finalText =

      parsedResponse?.text

      ||

      parsedResponse?.summary

      ||

      result?.text

      ||

      'Не удалось сформировать ответ';

    // -----------------------------------------------------
    // QUICK REPLIES
    // -----------------------------------------------------

    const finalQuickReplies =

      Array.isArray(
        parsedResponse?.quick_replies
      )

        ? parsedResponse.quick_replies

        : (

          result?.quickReplies || []
        );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({

      text:
        finalText,

      decision:
        result?.decision || {},

      quickReplies:
        finalQuickReplies,

      updatedMemory:
        result?.updatedMemory || null,

      lastAnalysis:
        result?.lastAnalysis || null,

      interviewCompleted:

        result?.decision
          ?.interviewCompleted || false
    });

  } catch (error: any) {

    console.error(
      'Chat error:',
      error
    );

    return res.status(500).json({

      error:
        'Ошибка при обработке запроса.',

      details:
        error?.message ||
        'Unknown error'
    });
  }
}