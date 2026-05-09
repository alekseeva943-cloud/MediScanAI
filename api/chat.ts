import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  try {
    const { messages, memory, lastAnalysis } = req.body;
    const { MedicalOrchestrator } = await import('../src/ai/orchestration/medicalOrchestrator.js');
    const orchestrator = new MedicalOrchestrator();

    // The frontend should pass the last message separately or we take the last one
    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1);

    // Extract image parts if present in the last message
    const imageParts: any[] = [];
    if (Array.isArray(lastMessage.content)) {
      lastMessage.content.forEach((part: any) => {
        if (part.type === 'image_url') {
          const base64Data = part.image_url.url.split(',')[1];
          imageParts.push({
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          });
        }
      });
    }

    const userInput = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : lastMessage.content.find((p: any) => p.type === 'text')?.text || "";

    const { text, decision } = await orchestrator.processRequest(
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
        extractedFacts: []
      },
      lastAnalysis || null
    );

    // If it's a full analysis, we might want to return the structured JSON
    // The orchestrator currently returns raw text from the model
    res.status(200).json({ text, decision });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Ошибка при обработке запроса.',
      details: error.message 
    });
  }
}
