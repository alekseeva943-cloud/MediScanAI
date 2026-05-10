// api/chat.ts

import type {
  VercelRequest,
  VercelResponse
} from '@vercel/node';

function containsAny(
  text: string,
  words: string[]
) {

  return words.some(word =>
    text.includes(word)
  );
}

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

    const {
      messages,
      memory,
      lastAnalysis
    } = req.body;

    const {
      MedicalOrchestrator
    } = await import(
      '../src/ai/orchestration/medicalOrchestrator.js'
    );

    const orchestrator =
      new MedicalOrchestrator();

    const safeMessages =
      Array.isArray(messages)
        ? messages
        : [];

    const lastMessage =
      safeMessages[
        safeMessages.length - 1
      ];

    const history =
      safeMessages.slice(-12, -1);

    if (!lastMessage) {

      return res.status(400).json({
        error:
          'Нет сообщения пользователя'
      });
    }

    // -----------------------------------
    // USER INPUT
    // -----------------------------------

    let userInput = '';

    if (
      typeof lastMessage.content
      === 'string'
    ) {

      userInput =
        lastMessage.content;
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
    // PROCESS AI
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
    // SAFE JSON PARSING
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

    } catch (err) {

      console.error(
        'JSON parse failed:',
        err
      );
    }

    // -----------------------------------
    // FINAL TEXT
    // -----------------------------------

    let finalText =

      parsedResponse?.text

      ||

      result?.text

      ||

      'Не удалось сформировать ответ';

    // -----------------------------------
    // QUICK REPLIES
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
    // ALWAYS ADD SKIP
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
    // HISTORY TEXT
    // -----------------------------------

    const fullConversation =

      safeMessages
        .map((m: any) =>

          typeof m.content === 'string'

            ? m.content

            : JSON.stringify(m.content)
        )
        .join(' ')
        .toLowerCase();

    // -----------------------------------
    // RED FLAGS
    // -----------------------------------

    const hasRedFlags =

      containsAny(
        fullConversation,
        [

          'кровь',

          'сильная боль',

          'температура',

          'рвота',

          'потеря сознания',

          'черный стул',

          'не могу ходить',

          'сильный отек',

          'гной'
        ]
      );

    // -----------------------------------
    // SAFE TRIGGER DETECTION
    // -----------------------------------

    const spicyFoodDetected =

      containsAny(
        fullConversation,
        [

          'остр',

          'халапеньо',

          'шаурм',

          'перец'
        ]
      );

    const repeatedPatternDetected =

      containsAny(
        fullConversation,
        [

          'каждый раз',

          'раньше было',

          'повторяется'
        ]
      );

    const mildCaseDetected =

      containsAny(
        fullConversation,
        [

          'только жжение',

          'нет других симптомов',

          'нет температуры',

          'все нормально'
        ]
      );

    // -----------------------------------
    // QUESTION LOOP DETECTION
    // -----------------------------------

    const assistantQuestions =
      safeMessages.filter(
        (m: any) =>
          m.role === 'assistant'
      );

    const clarificationCount =
      assistantQuestions.length;

    // -----------------------------------
    // AUTO FINISH LOGIC
    // -----------------------------------

    let interviewCompleted =

      parsedResponse
        ?.interview_completed

      ||

      result?.decision
        ?.interviewCompleted

      ||

      false;

    const shouldForceFinish =

      !hasRedFlags

      &&

      spicyFoodDetected

      &&

      (
        repeatedPatternDetected
        ||

        mildCaseDetected
        ||

        clarificationCount >= 6
      );

    // -----------------------------------
    // FORCE FINISH
    // -----------------------------------

    if (

      shouldForceFinish

      &&

      !interviewCompleted

    ) {

      interviewCompleted = true;

      finalText =

        'Наиболее вероятно, это раздражение слизистой и кожи после острой пищи. '

        +

        'Серьезных опасных признаков сейчас не видно. '

        +

        'Обычно такое состояние проходит самостоятельно в течение 1–2 дней. '

        +

        'Постарайтесь временно исключить острую пищу, используйте мягкую туалетную бумагу и избегайте дополнительного раздражения области. '

        +

        'Если появятся кровь, сильная боль, температура или симптомы усилятся — обратитесь к врачу.';

      finalQuickReplies = [

        '📄 Создать отчет',

        '🩻 Загрузить МРТ',

        '🧪 Прикрепить анализы',

        '📷 Загрузить фото',

        '➕ Добавить симптомы'
      ];
    }

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

          interviewCompleted

            ? 'FULL_MEDICAL_ANALYSIS'

            : (

              parsedResponse
                ?.render_mode

              ||

              result?.decision
                ?.mode
            ),

        interviewCompleted
      },

      quickReplies:
        finalQuickReplies,

      updatedMemory:
        result?.updatedMemory || null,

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