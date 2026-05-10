// api/chat.ts

import type {
  VercelRequest,
  VercelResponse
} from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  // -----------------------------------
  // METHOD CHECK
  // -----------------------------------

  if (req.method !== 'POST') {

    return res.status(405).json({
      error:
        'Метод не поддерживается'
    });
  }

  try {

    const {
      messages,
      memory,
      lastAnalysis
    } = req.body;

    // -----------------------------------
    // IMPORT ORCHESTRATOR
    // -----------------------------------

    const {
      MedicalOrchestrator
    } = await import(
      '../src/ai/orchestration/medicalOrchestrator.js'
    );

    const orchestrator =
      new MedicalOrchestrator();

    // -----------------------------------
    // SAFE MESSAGES
    // -----------------------------------

    const safeMessages =
      Array.isArray(messages)
        ? messages
        : [];

    const lastMessage =
      safeMessages[
        safeMessages.length - 1
      ];

    const history =
      safeMessages.slice(-8, -1);

    if (!lastMessage) {

      return res.status(400).json({
        error:
          'Нет сообщения пользователя'
      });
    }

    // -----------------------------------
    // IMAGE EXTRACTION
    // -----------------------------------

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

    // -----------------------------------
    // USER INPUT EXTRACTION
    // -----------------------------------

    let userInput = "";

    if (
      typeof lastMessage.content
      === 'string'
    ) {

      userInput =
        lastMessage.content;

    } else if (
      Array.isArray(
        lastMessage.content
      )
    ) {

      const textPart =
        lastMessage.content.find(
          (p: any) =>

            p.type === 'text'

            ||

            p.type === 'input_text'
        );

      userInput =
        textPart?.text || "";
    }

    // -----------------------------------
    // PROCESS REQUEST
    // -----------------------------------

    const result =
      await orchestrator.processRequest(

        userInput,

        imageParts,

        history,

        memory || {

          symptoms: [],
          medications: [],
          diagnoses: [],
          allergies: [],
          riskFactors: [],
          uploadedDocuments: [],
          extractedFacts: [],

          chronicConditions: [],
          surgeries: [],
          familyHistory: []
        },

        lastAnalysis || null
      );

    // -----------------------------------
    // SAFE AI RESPONSE PARSING
    // -----------------------------------

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

    } catch (parseError) {

      console.error(
        'JSON parse failed:',
        parseError
      );
    }

    // -----------------------------------
    // FINAL TEXT
    // -----------------------------------

    const finalText =

      parsedResponse?.text

      ||

      result?.text

      ||

      'Не удалось сформировать ответ';

    // -----------------------------------
    // FINAL QUICK REPLIES
    // -----------------------------------

    let finalQuickReplies: string[] = [];

    if (

      Array.isArray(
        parsedResponse?.quick_replies
      )

    ) {

      finalQuickReplies =
        parsedResponse
          .quick_replies;

    } else if (

      Array.isArray(
        result?.quickReplies
      )

    ) {

      finalQuickReplies =
        result.quickReplies;
    }

    // -----------------------------------
    // ALWAYS ADD SKIP BUTTON
    // -----------------------------------

    if (

      finalQuickReplies.length > 0

      &&

      !finalQuickReplies.includes(
        'Пропустить'
      )

    ) {

      finalQuickReplies.push(
        'Пропустить'
      );
    }

    // -----------------------------------
    // INTERVIEW COMPLETED
    // -----------------------------------

    const interviewCompleted =

      parsedResponse
        ?.interview_completed

      ||

      result?.decision
        ?.interviewCompleted

      ||

      false;

    // -----------------------------------
    // FINAL ACTIONS
    // -----------------------------------

    if (

      interviewCompleted

      &&

      finalQuickReplies.length === 0

    ) {

      finalQuickReplies = [

        '📄 Создать отчет',

        '🩻 Загрузить МРТ',

        '🧪 Прикрепить анализы',

        '📷 Загрузить фото',

        '➕ Добавить симптомы'
      ];
    }

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    return res.status(200).json({

      text:
        finalText,

      decision: {

        ...(result?.decision || {}),

        mode:

          parsedResponse
            ?.render_mode

          ||

          result?.decision
            ?.mode
      },

      quickReplies:
        finalQuickReplies,

      updatedMemory:
        result?.updatedMemory || null,

      // ВАЖНО:
      // возвращаем НОВЫЙ analysis,
      // а не старый из req.body

      lastAnalysis:
        result?.lastAnalysis || null,

      interviewCompleted
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