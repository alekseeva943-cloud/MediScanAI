// src/components/MessageList.tsx

import { useRef, useEffect, useState } from 'react';

import ReactMarkdown from 'react-markdown';

import { motion } from 'motion/react';

import { Message } from '../types';

import { MedicalAnalysis } from './MedicalAnalysis';

import { AnalysisSnapshotView } from './AnalysisSnapshot';

import { formatTime } from '../lib/utils';

import {
  User,
  Bot,
  Loader2,
  Mic,
  AlertTriangle
} from 'lucide-react';

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

export const MessageList = ({
  messages,
  isLoading
}: {
  messages: Message[],
  isLoading: boolean
}) => {

  const scrollRef =
    useRef<HTMLDivElement>(null);

  const status =
    useChatStore(state => state.status);

  const lastAnalysis =
    useChatStore(state => state.lastAnalysis);

  useEffect(() => {

    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });

  }, [messages, isLoading]);

  return (

    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide"
    >

      {/* SNAPSHOT */}

      {lastAnalysis && (
        <AnalysisSnapshotView
          snapshot={lastAnalysis}
        />
      )}

      {/* EMPTY */}

      {messages.length === 0 && !lastAnalysis && (

        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">

          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">

            <Bot size={32} />

          </div>

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Добро пожаловать в AI Фармацевт
            </h2>

            <p className="text-sm max-w-xs mx-auto">
              Опишите симптомы, загрузите фото
              или отправьте голосовое сообщение.
            </p>

          </div>
        </div>
      )}

      {/* MESSAGES */}

      {messages.map((message) => {

        const renderMode =
          message.ai_data?.render_mode;

        const isMedicalDashboard =

          renderMode ===
            'FULL_MEDICAL_ANALYSIS'

          ||

          renderMode ===
            'ANALYSIS_UPDATE_MODE';

        const isEmergency =
          renderMode ===
            'EMERGENCY_WARNING_MODE';

        const isClarification =
          renderMode ===
            'CLARIFICATION_MODE';

        return (

          <motion.div

            key={message.id}

            initial={{
              opacity: 0,
              y: 10
            }}

            animate={{
              opacity: 1,
              y: 0
            }}

            className={`flex gap-3 ${
              message.role === 'user'
                ? 'flex-row-reverse'
                : ''
            }`}
          >

            {/* AVATAR */}

            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-blue-50 text-blue-500'
                : isEmergency
                  ? 'bg-red-100 text-red-500'
                  : isClarification
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-500'
            }`}>

              {message.role === 'user'
                ? <User size={16} />
                : isEmergency
                  ? <AlertTriangle size={16} />
                  : <Bot size={16} />
              }

            </div>

            {/* MESSAGE */}

            <div className={`max-w-[85%] space-y-1 ${
              message.role === 'user'
                ? 'items-end'
                : 'items-start'
            }`}>

              <div className={`p-4 ${
                message.role === 'user'
                  ? 'message-user shadow-sm shadow-violet-100/50'
                  : isMedicalDashboard
                    ? 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-3xl shadow-md'
                    : isEmergency
                      ? 'bg-red-50 border border-red-200 rounded-2xl shadow-sm'
                      : isClarification
                        ? 'bg-amber-50 border border-amber-100 rounded-3xl shadow-sm'
                        : 'message-ai'
              }`}>

                {/* ATTACHMENTS */}

                {message.attachments?.map((att, i) => (

                  <div
                    key={i}
                    className="mb-3"
                  >

                    {att.type === 'image' && (

                      <img
                        src={att.url}
                        alt="Attached"

                        className="rounded-xl max-w-full max-h-64 object-cover border border-black/10"
                      />
                    )}

                    {att.type === 'voice' && (

                      <div className="flex items-center gap-3 p-2.5 bg-white/20 rounded-xl border border-white/30 mb-1">

                        <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">

                          <Mic
                            size={14}

                            className={
                              message.role === 'user'
                                ? 'text-white'
                                : 'text-blue-500'
                            }
                          />

                        </div>

                        <div className="flex-1 space-y-1">

                          <div className="h-1 bg-white/30 rounded-full w-full overflow-hidden">

                            <motion.div

                              className="h-full bg-white"

                              initial={{
                                width: "0%"
                              }}

                              animate={{
                                width:
                                  message.content ===
                                    'Голосовое сообщение...'
                                      ? "60%"
                                      : "100%"
                              }}

                              transition={{
                                duration: 1,

                                repeat:
                                  message.content ===
                                    'Голосовое сообщение...'
                                      ? Infinity
                                      : 0
                              }}
                            />

                          </div>

                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">

                            {message.content ===
                              'Голосовое сообщение...'
                                ? 'Дешифровка'
                                : 'Аудио'}

                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* CLARIFICATION MODE */}

                {isClarification ? (

                  <div className="space-y-4">

                    <div className="flex items-center justify-between">

                      <div>

                        <div className="text-[11px] uppercase tracking-widest font-bold text-amber-600">
                          Медицинское уточнение
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          Ответьте на вопрос или выберите вариант ниже
                        </div>

                      </div>

                      <div className="text-xs font-semibold text-slate-400">
                        Шаг
                      </div>

                    </div>

                    <div className="text-base font-medium text-slate-800 leading-relaxed">

                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>

                    </div>

                  </div>

                ) : isMedicalDashboard && message.ai_data ? (

                  <MedicalAnalysis
                    data={message.ai_data}
                  />

                ) : (

                  <div className="prose prose-sm prose-slate max-w-none">

                    <div className={cn(
                      message.content ===
                        'Голосовое сообщение...'
                          && "italic opacity-50 text-xs"
                    )}>

                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>

                    </div>
                  </div>
                )}
              </div>

              {/* TIME */}

              <span className="text-[10px] text-slate-400 px-1">

                {formatTime(
                  new Date(message.timestamp)
                )}

              </span>
            </div>
          </motion.div>
        );
      })}

      {/* LOADING */}

      {isLoading && (

        <motion.div

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          className="flex gap-3"
        >

          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">

            <Bot
              size={16}
              className="text-blue-500 animate-bounce"
            />

          </div>

          <div className="message-ai p-4 space-y-2 min-w-[140px] border-emerald-100 bg-emerald-50/30">

            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">

              <Loader2
                size={12}
                className="animate-spin"
              />

              <span>
                {status || 'Обработка'}
                <Dots />
              </span>

            </div>

            <div className="space-y-1.5">

              <div className="h-1.5 bg-teal-200/30 rounded w-full animate-pulse-soft"></div>

              <div className="h-1.5 bg-teal-200/30 rounded w-2/3 animate-pulse-soft"></div>

            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};