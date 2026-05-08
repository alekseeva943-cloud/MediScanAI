import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Mic, Send, X, Loader2, StopCircle, Paperclip } from 'lucide-react';
import { Button, Input } from './UI';
import { apiService } from '../services/apiService';
import { nanoid } from 'nanoid';
import { Message, AIResponse } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useChatStore } from '../store/useChatStore';

const VoiceWaveform = () => {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-red-400 rounded-full"
          animate={{
            height: [4, 16, 8, 12, 4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

interface ChatInputProps {
  onSend: (text: string, image?: string, audioBlob?: Blob) => void;
  isLoading: boolean;
  suggestions?: string[];
}

export const ChatInput = ({ onSend, isLoading, suggestions }: ChatInputProps) => {
  const setLoading = useChatStore(state => state.setLoading);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !image) || isLoading) return;
    onSend(text, image || undefined);
    setText('');
    setImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      // Reset input value to allow the same file to be selected again if needed
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Определяем поддерживаемый формат
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 
                      MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : '';
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blobMime = mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: blobMime });
          if (audioBlob.size > 500) { // Игнорируем слишком короткие записи
            onSend('', undefined, audioBlob);
          }
        }
        setIsRecording(false);
        // Очищаем стрим
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      alert('Нет доступа к микрофону или ошибка записи');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
  };

  return (
    <div className="p-4 bg-white border-t border-slate-100 space-y-4">
      <AnimatePresence>
        {suggestions && suggestions.length > 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {suggestions.map((s, i) => (
              <Button key={i} variant="secondary" className="whitespace-nowrap rounded-full py-1.5 px-4 h-auto text-xs" onClick={() => handleSuggestionClick(s)}>
                {s}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {image && (
        <div className="relative inline-block">
          <img src={image} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-blue-500" />
          <button 
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1.5 items-center">
        {/* Инпут для файлов */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload}
        />
        {/* Инпут для камеры */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          ref={cameraInputRef} 
          onChange={handleImageUpload}
        />

        <Button 
          type="button" 
          variant="ghost" 
          className="rounded-full w-11 h-11 p-0 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isRecording}
          title="Загрузить файл"
        >
          <Paperclip size={20} className="text-slate-500" />
        </Button>

        <Button 
          type="button" 
          variant="ghost" 
          className="rounded-full w-11 h-11 p-0 shrink-0"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isLoading || isRecording}
          title="Сделать фото"
        >
          <Camera size={20} className="text-slate-500" />
        </Button>

        <div className="relative flex-1">
          <Input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? "Слушаю вас..." : "Задайте вопрос..."}
            disabled={isLoading || isRecording || isTranscribing}
            className={cn("pr-12 rounded-full h-11", isRecording && "pl-12 border-red-200 bg-red-50/30")}
          />
          {isRecording && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <VoiceWaveform />
            </div>
          )}
          {isTranscribing && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 size={18} className="animate-spin text-blue-500" />
            </div>
          )}
        </div>

        <Button 
          type="button"
          variant={isRecording ? "danger" : "ghost"}
          className={cn("rounded-full w-11 h-11 p-0 shrink-0", isRecording && "animate-pulse")}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || isTranscribing}
          title={isRecording ? "Остановить" : "Голосовой поиск"}
        >
          {isRecording ? <StopCircle size={20} /> : <Mic size={20} className="text-slate-500" />}
        </Button>

        <Button 
          type="submit" 
          className="rounded-full w-11 h-11 p-0 shrink-0 shadow-lg shadow-blue-200"
          disabled={(!text.trim() && !image) || isLoading || isRecording}
        >
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
};
