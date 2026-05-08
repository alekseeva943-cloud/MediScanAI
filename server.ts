import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  // Local mirror of /api/chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, systemPrompt } = req.body;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        response_format: { type: 'json_object' },
      });
      res.json(JSON.parse(response.choices[0].message.content || '{}'));
    } catch (error: any) {
      console.error('Local API Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Local mirror of /api/voice
  app.post('/api/voice', async (req, res) => {
    try {
      const form = formidable();
      const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });
      const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!audioFile) {
        return res.status(400).json({ error: 'No audio file' });
      }

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile.filepath),
        model: 'whisper-1',
        language: 'ru',
      });
      res.json({ text: transcription.text });
    } catch (error: any) {
      console.error('Local Voice Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running on http://localhost:${PORT}`);
  });
}

startServer();
