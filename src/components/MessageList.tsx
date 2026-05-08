import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';
import { MedicalAnalysis } from './MedicalAnalysis';
import { formatTime } from '../lib/utils';
import { User, Bot } from 'lucide-react';

export const MessageList = ({ messages, isLoading }: { messages: Message[], isLoading: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Bot size={32} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Добро пожаловать в AI Фармацевт</h2>
            <p className="text-sm max-w-xs mx-auto">Загрузите фото лекарства, рецепта или задайте вопрос голосом.</p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
          </div>
          
          <div className={`max-w-[85%] space-y-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-4 shadow-sm ${message.role === 'user' ? 'message-user' : 'message-ai'}`}>
              
              {message.attachments?.map((att, i) => (
                <div key={i} className="mb-3">
                  {att.type === 'image' && (
                    <img src={att.url} alt="Attached" className="rounded-xl max-w-full max-h-64 object-cover border border-black/10" />
                  )}
                  {att.type === 'voice' && (
                    <div className="flex items-center gap-2 p-2 bg-black/5 rounded-lg text-xs italic">
                      🎤 Голосовое сообщение
                    </div>
                  )}
                </div>
              ))}

            <div className="prose prose-sm prose-slate max-w-none">
                {!message.ai_data && <ReactMarkdown>{message.content}</ReactMarkdown>}
              </div>

              {message.ai_data && <MedicalAnalysis data={message.ai_data} />}
            </div>
            <span className="text-[10px] text-slate-400 px-1">{formatTime(new Date(message.timestamp))}</span>
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
            <Bot size={16} className="text-slate-400" />
          </div>
          <div className="message-ai p-4 space-y-2 w-32 animate-pulse-soft">
            <div className="h-2 bg-slate-100 rounded w-full"></div>
            <div className="h-2 bg-slate-100 rounded w-2/3"></div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
