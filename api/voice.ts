import { VercelRequest, VercelResponse } from '@vercel/node';
import { openai } from './utils/openai.js';
import formidable from 'formidable';
import fs from 'fs';
import { toFile } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(450).json({ error: 'Метод не поддерживается' });
  }

  try {
    const form = formidable();
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });
    // Инстанс OpenAI загружен из utils/openai.js
    const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!audioFile) {
      return res.status(400).json({ error: 'Файл не найден' });
    }

    // Читаем файл в буфер и создаем File объект для OpenAI
    const buffer = fs.readFileSync(audioFile.filepath);
    const file = await toFile(buffer, 'voice.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ru',
    });

    res.status(200).json({ text: transcription.text });
  } catch (error: any) {
    console.error('Voice error:', error);
    res.status(500).json({ 
      error: 'Ошибка при обработке голосового сообщения.',
      details: error.message 
    });
  }
}
