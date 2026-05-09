// api/chat.ts

import type {
  VercelRequest,
  VercelResponse
} from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  if (req.method !== 'POST') {

    return res.status(405).json({
      error: 'Метод не поддерживается'
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
      safeMessages[safeMessages.length - 1];

    const history =
      safeMessages.slice(-6, -1);

    if (!lastMessage) {

      return res.status(400).json({
        error: 'Нет сообщения пользователя'
      });
    }

    // -------------------------
    // IMAGE EXTRACTION
    // -------------------------

    const imageParts: any[] = [];

    if (Array.isArray(lastMessage.content)) {

      lastMessage.content.forEach((part: any) => {

        if (
          part?.type === 'image_url' &&
          part?.image_url?.url
        ) {

          const url = part.image_url.url;

          const matches =
            url.match(/^data:(.*?);base64,(.*)$/);

          if (!matches) {
            return;
          }

          const mimeType = matches[1];

          const base64Data = matches[2];

          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        }
      });
    }

    // -------------------------
    // USER INPUT EXTRACTION
    // -------------------------

    let userInput = "";

    if (typeof lastMessage.content === 'string') {

      userInput = lastMessage.content;

    } else if (Array.isArray(lastMessage.content)) {

      const textPart =
        lastMessage.content.find(
          (p: any) =>
            p.type === 'text' ||
            p.type === 'input_text'
        );

      userInput =
        textPart?.text || "";
    }

    // -------------------------
    // PROCESS REQUEST
    // -------------------------

    const {
      text,
      decision,
      updatedMemory
    } = await orchestrator.processRequest(
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

    // -------------------------
    // TRY PARSE ANALYSIS
    // -------------------------

    let parsedAnalysis = null;

    try {

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsedAnalysis = JSON.parse(cleaned);

    } catch {

      parsedAnalysis = null;
    }

    // -------------------------
    // RESPONSE
    // -------------------------

    return res.status(200).json({
      text,
      decision,

      updatedMemory,

      lastAnalysis:
        parsedAnalysis || lastAnalysis || null
    });

  } catch (error: any) {

    console.error('Chat error:', error);

    return res.status(500).json({
      error: 'Ошибка при обработке запроса.',
      details: error?.message || 'Unknown error'
    });
  }
}