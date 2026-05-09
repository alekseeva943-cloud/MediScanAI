import { useState, useCallback, useMemo } from 'react';
import { useChatStore } from './store/useChatStore';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { apiService } from './services/apiService';
import { nanoid } from 'nanoid';
import { AIResponse, Message } from './types';
import { Bot, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from './components/UI';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { messages, isLoading, error, addMessage, updateMessage, setLoading, setError, clearHistory } = useChatStore();
  
  const lastAiResponse = useMemo(() => {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    return aiMessages[aiMessages.length - 1]?.ai_data;
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string, image?: string, audioBlob?: Blob) => {
    if (!text.trim() && !image && !audioBlob) return;

    const messageId = nanoid();
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      content: text || (audioBlob ? 'Голосовое сообщение...' : ''),
      timestamp: Date.now(),
      attachments: image ? [{ type: 'image', url: image }] : audioBlob ? [{ type: 'voice', url: 'voice.webm' }] : undefined,
    };

    addMessage(userMessage);
    setError(null);

    try {
      let finalContent = text;

      // Если это голосовое — сначала расшифровываем (без общего лоадера бота)
      if (audioBlob) {
        try {
          finalContent = await apiService.transcribeVoice(audioBlob);
          // Check if we still have messages (wasn't cleared)
          if (useChatStore.getState().messages.length > 0) {
            updateMessage(messageId, { content: finalContent });
          } else {
            return; // Exit if cleared
          }
        } catch (err: any) {
          if (useChatStore.getState().messages.length > 0) {
            updateMessage(messageId, { content: '⚠️ Не удалось расшифровать голос. Попробуйте еще раз.' });
          }
          throw err;
        }
      }

      // Теперь включаем лоадер бота для генерации ответа
      setLoading(true, image ? 'Анализ изображения' : 'Подготовка ответа');

      const currentMessages = useChatStore.getState().messages;
      if (currentMessages.length === 0) return; // Exit if cleared

      const history = currentMessages.map(m => {
        // Используем актуальный текст для текущего сообщения
        const contentText = m.id === messageId ? finalContent : (m.content || m.ai_data?.summary || '');
        const content: any[] = [{ type: 'text', text: contentText }];
        
        if (m.attachments) {
          m.attachments.forEach(att => {
            if (att.type === 'image') {
              content.push({ type: 'image_url', image_url: { url: att.url } });
            }
          });
        }
        return { role: m.role, content };
      });

      // Step 2: More detailed analysis status
      if (image) {
        setLoading(true, 'Анализ фото');
        await new Promise(r => setTimeout(r, 800));
        setLoading(true, 'Обработка фото');
      } else {
        setLoading(true, 'Подготовка ответа');
      }

      const medicalMemory = useChatStore.getState().medicalMemory;
      const lastAnalysis = useChatStore.getState().lastAnalysis;

      const { text: aiText, decision } = await apiService.chat(history, medicalMemory, lastAnalysis);
      
      if (useChatStore.getState().messages.length === 0) return; // Exit if cleared
      
      setLoading(true, 'Завершение');

      let aiData: AIResponse;
      
      if (decision.mode === 'FULL_MEDICAL_ANALYSIS') {
        try {
          const parsed = JSON.parse(aiText.replace(/```json|```/g, ""));
          aiData = {
            summary: parsed.summary,
            possible_risks: parsed.risks,
            recommendations: parsed.recommendations,
            danger_level: parsed.danger_level,
            suggested_actions: parsed.suggested_actions,
            medical_warning: "Это предварительный анализ ИИ. Обратитесь к врачу.",
            is_analysis_needed: false
          };
          
          useChatStore.getState().setLastAnalysis({
            timestamp: Date.now(),
            summary: parsed.summary,
            probableDiagnoses: parsed.probableDiagnoses,
            risks: parsed.risks,
            medications: parsed.medications,
            recommendations: parsed.recommendations
          });
        } catch (e) {
          aiData = {
            summary: aiText,
            possible_risks: [],
            recommendations: [],
            danger_level: 'low',
            suggested_actions: [],
            medical_warning: "Ошибка разбора анализа.",
            is_analysis_needed: true
          };
        }
      } else {
        aiData = {
          summary: aiText,
          possible_risks: [],
          recommendations: [],
          danger_level: decision.emergencyLevel,
          suggested_actions: decision.clarificationQuestions || [],
          medical_warning: decision.emergencyLevel === 'high' ? "НЕМЕДЛЕННО ОБРАТИТЕСЬ К ВРАЧУ!" : "Это ИИ ассистент.",
          is_analysis_needed: decision.needsClarification
        };
      }
      
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: aiData.summary,
        timestamp: Date.now(),
        ai_data: aiData,
      };

      addMessage(assistantMessage);
    } catch (err: any) {
      const errorMessage = typeof err.message === 'string' ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [messages, addMessage, updateMessage, setLoading, setError]);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-2xl relative overflow-hidden">
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 right-4 z-50 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <Trash2 size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-5 py-4 bg-teal-600 border-b border-teal-700/50 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">AI Фармацевт</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-pulse shadow-sm shadow-teal-300/50" />
              <span className="text-[10px] text-teal-50/70 font-bold uppercase tracking-widest">Ассистент онлайн</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex items-center gap-2 px-3 text-teal-50 hover:bg-white/10 hover:text-white transition-all rounded-xl" onClick={clearHistory}>
            <Trash2 size={16} />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-tight">Очистить</span>
          </Button>
        </div>
      </header>

      {/* Warning Bar */}
      <div className="bg-amber-50 px-4 py-1.5 flex items-center justify-center gap-2 border-b border-amber-100 z-10">
        <ShieldAlert size={12} className="text-amber-500" />
        <span className="text-[10px] text-amber-700 font-medium">Это не заменяет консультацию врача</span>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-h-0">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>

      {/* Footer / Input */}
      <footer className="relative z-20">
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading} 
          suggestions={lastAiResponse?.suggested_actions}
        />
      </footer>

      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-teal-400/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
