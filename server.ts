import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI, { toFile } from 'openai';
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
    console.log('Voice request received');
    try {
      const form = formidable({
        maxFiles: 1,
        maxFileSize: 25 * 1024 * 1024, // 25MB
      });
      
      const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Formidable parse error:', err);
            reject(err);
            return;
          }
          resolve([fields, files]);
        });
      });

      const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!audioFile) {
        console.error('No audio file found in multipart request');
        return res.status(400).json({ error: 'No audio file' });
      }

      console.log('Processing audio file:', audioFile.filepath);
      const buffer = fs.readFileSync(audioFile.filepath);
      
      if (!buffer || buffer.length === 0) {
        throw new Error('Audio buffer is empty');
      }

      const file = await toFile(buffer, 'voice.webm', { type: 'audio/webm' });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'ru',
      });
      
      console.log('Transcription successful');
      res.status(200).json({ text: transcription.text });
    } catch (error: any) {
      console.error('Local Voice Error Details:', error);
      res.status(500).json({ 
        error: error.message || 'Unknown voice processing error',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      });
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
