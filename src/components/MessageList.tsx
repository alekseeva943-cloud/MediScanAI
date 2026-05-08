import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types';
import { MedicalAnalysis } from './MedicalAnalysis';
import { formatTime } from '../lib/utils';
import { User, Bot, Loader2, Mic } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { cn } from '../lib/utils';

const Dots = () => {
  const [count, setCount] = useState(1);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return <span>{'.'.repeat(count)}</span>;
};

export const MessageList = ({ messages, isLoading }: { messages: Message[], isLoading: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const status = useChatStore(state => state.status);

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
                    <div className="flex items-center gap-3 p-2.5 bg-white/20 rounded-xl border border-white/30 mb-1">
                      <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
                        <Mic size={14} className={message.role === 'user' ? 'text-white' : 'text-blue-500'} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1 bg-white/30 rounded-full w-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-white" 
                            initial={{ width: "0%" }}
                            animate={{ width: message.content === 'Голосовое сообщение...' ? "60%" : "100%" }}
                            transition={{ duration: 1, repeat: message.content === 'Голосовое сообщение...' ? Infinity : 0 }}
                          />
                        </div>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">
                          {message.content === 'Голосовое сообщение...' ? 'Дешифровка' : 'Аудио'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            <div className="prose prose-sm prose-slate max-w-none">
                {!message.ai_data && (
                  <div className={cn(message.content === 'Голосовое сообщение...' && "italic opacity-50 text-xs")}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {message.ai_data && <MedicalAnalysis data={message.ai_data} />}
            </div>
            <span className="text-[10px] text-slate-400 px-1">{formatTime(new Date(message.timestamp))}</span>
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <Bot size={16} className="text-blue-500 animate-bounce" />
          </div>
          <div className="message-ai p-4 space-y-2 min-w-[140px] border-blue-100 bg-blue-50/50">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <Loader2 size={12} className="animate-spin" />
              <span>{status || 'Обработка'}<Dots /></span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 bg-blue-200/50 rounded w-full animate-pulse-soft"></div>
              <div className="h-1.5 bg-blue-200/50 rounded w-2/3 animate-pulse-soft"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
