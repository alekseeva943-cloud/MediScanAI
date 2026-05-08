import { VercelRequest, VercelResponse } from '@vercel/node';
import { openai } from './_utils/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(450).json({ error: 'Метод не поддерживается' });
  }

  try {
    const { messages, systemPrompt } = req.body;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use gpt-4o for multimodal and better reasoning
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');

    res.status(200).json(JSON.parse(content));
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Ошибка при обработке запроса. Пожалуйста, проверьте API ключ и попробуйте снова.',
      details: error.message 
    });
  }
}
