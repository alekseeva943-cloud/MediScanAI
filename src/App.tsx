import { useState, useCallback, useMemo } from 'react';
import { useChatStore } from './store/useChatStore';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { apiService } from './services/apiService';
import { nanoid } from 'nanoid';
import { Message } from './types';
import { Bot, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from './components/UI';

export default function App() {
  const { messages, isLoading, addMessage, updateMessage, setLoading, setError, clearHistory } = useChatStore();
  
  const lastAiResponse = useMemo(() => {
    const aiMessages = messages.filter(m => m.role === 'assistant');
    return aiMessages[aiMessages.length - 1]?.ai_data;
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string, image?: string, isVoice?: boolean) => {
    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: image ? [{ type: 'image', url: image }] : isVoice ? [{ type: 'voice', url: 'voice.webm' }] : undefined,
    };

    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const history = messages.map(m => {
        const content: any[] = [{ type: 'text', text: m.content }];
        if (m.attachments) {
          m.attachments.forEach(att => {
            if (att.type === 'image') {
              content.push({ type: 'image_url', image_url: { url: att.url } });
            }
          });
        }
        return { role: m.role, content };
      });

      const currentContent: any[] = [{ type: 'text', text: userMessage.content }];
      if (image) {
        currentContent.push({ type: 'image_url', image_url: { url: image } });
      }

      history.push({ role: 'user', content: currentContent });

      const aiData = await apiService.chat(history);
      
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: aiData.summary,
        timestamp: Date.now(),
        ai_data: aiData,
      };

      addMessage(assistantMessage);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [messages, addMessage, setLoading, setError]);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-slate-50 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 glass border-b border-white/40 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">AI Фармацевт</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">ИИ ассистент онлайн</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={clearHistory}>
            <Trash2 size={16} />
            <span className="hidden sm:inline text-xs font-semibold">Очистить</span>
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
