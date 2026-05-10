// src/App.tsx

import {
  useCallback,
  useMemo
} from 'react';

import {
  nanoid
} from 'nanoid';

import {
  AnimatePresence,
  motion
} from 'motion/react';

import {
  Bot,
  Trash2,
  ShieldAlert
} from 'lucide-react';

import {
  useChatStore
} from './store/useChatStore';

import {
  MessageList
} from './components/MessageList';

import {
  ChatInput
} from './components/ChatInput';

import {
  Button
} from './components/UI';

import {
  apiService
} from './services/apiService';

import type {
  AIResponse,
  Message
} from './types';

export default function App() {

  const {

    messages,

    isLoading,

    error,

    addMessage,

    updateMessage,

    setLoading,

    setError,

    clearHistory,

    setMedicalMemory,

    setLastAnalysis,

    medicalInterviewState,

    addAskedQuestion,

    addAnsweredFact,

    addPossibleTrigger,

    addConfirmedSymptom,

    updateInterviewState

  } = useChatStore();

  const lastAiResponse =
    useMemo(() => {

      const aiMessages =
        messages.filter(
          m => m.role === 'assistant'
        );

      return aiMessages[
        aiMessages.length - 1
      ]?.ai_data;

    }, [messages]);

  const handleSendMessage =
    useCallback(async (

      text: string,

      image?: string,

      audioBlob?: Blob

    ) => {

      if (

        !text.trim()

        &&

        !image

        &&

        !audioBlob

      ) {

        return;
      }

      const messageId =
        nanoid();

      const userMessage: Message = {

        id:
          messageId,

        role:
          'user',

        content:

          text ||

          (

            audioBlob

              ? 'Голосовое сообщение...'

              : ''
          ),

        timestamp:
          Date.now(),

        attachments:

          image

            ? [{
                type: 'image',
                url: image
              }]

            : audioBlob

              ? [{
                  type: 'voice',
                  url: 'voice.webm'
                }]

              : undefined
      };

      addMessage(
        userMessage
      );

      setError(null);

      try {

        let finalContent =
          text;

        // -----------------------------------
        // VOICE
        // -----------------------------------

        if (audioBlob) {

          try {

            finalContent =

              await apiService
                .transcribeVoice(
                  audioBlob
                );

            updateMessage(
              messageId,
              {
                content:
                  finalContent
              }
            );

          } catch (err: any) {

            updateMessage(
              messageId,
              {
                content:
                  '⚠️ Не удалось расшифровать голос.'
              }
            );

            throw err;
          }
        }

        // -----------------------------------
        // INTERVIEW MEMORY
        // -----------------------------------

        if (

          finalContent

          &&

          finalContent !== 'Пропустить'

        ) {

          addAnsweredFact(
            finalContent
          );

          // VERY LIGHTWEIGHT TRIGGER DETECTION

          const lower =
            finalContent.toLowerCase();

          if (

            lower.includes('остр')

            ||

            lower.includes('алког')

          ) {

            addPossibleTrigger(
              finalContent
            );
          }

          if (

            lower.includes('зуд')

            ||

            lower.includes('боль')

            ||

            lower.includes('жжение')

            ||

            lower.includes('отек')

          ) {

            addConfirmedSymptom(
              finalContent
            );
          }
        }

        // -----------------------------------
        // LOADING
        // -----------------------------------

        setLoading(

          true,

          image

            ? 'Анализ изображения'

            : 'Медицинский анализ'
        );

        // -----------------------------------
        // STRUCTURED HISTORY
        // -----------------------------------

        const history =

          useChatStore
            .getState()
            .messages
            .map(m => {

              if (m.role === 'user') {

                return {

                  role:
                    'user',

                  content:
                    m.content
                };
              }

              return {

                role:
                  'assistant',

                content:
                  JSON.stringify({

                    text:
                      m.content,

                    render_mode:
                      m.ai_data?.render_mode || null,

                    quick_replies:
                      m.ai_data?.quick_replies || [],

                    interview_completed:

                      m.ai_data
                        ?.interviewCompleted || false,

                    router_decision:

                      m.ai_data
                        ?.router_decision || null
                  })
              };
            });

        // -----------------------------------
        // MEDICAL INTERVIEW CONTEXT
        // -----------------------------------

        const interviewContext = {

          medical_interview_state: {

            main_complaint:
              medicalInterviewState
                .mainComplaint,

            confirmed_symptoms:
              medicalInterviewState
                .confirmedSymptoms,

            denied_symptoms:
              medicalInterviewState
                .deniedSymptoms,

            possible_triggers:
              medicalInterviewState
                .possibleTriggers,

            asked_questions:
              medicalInterviewState
                .askedQuestions,

            answered_facts:
              medicalInterviewState
                .answeredFacts,

            current_hypotheses:
              medicalInterviewState
                .currentHypotheses
          },

          instructions: [

            'НЕ повторяй уже заданные вопросы',

            'Анализируй уже известные факты',

            'Сначала исключай наиболее вероятные причины',

            'Не спрашивай повторно про подтвержденные триггеры',

            'Не задавай generic-вопросы'
          ]
        };

        // -----------------------------------
        // STORE DATA
        // -----------------------------------

        const medicalMemory =

          useChatStore
            .getState()
            .medicalMemory;

        const lastAnalysis =

          useChatStore
            .getState()
            .lastAnalysis;

        // -----------------------------------
        // API
        // -----------------------------------

        const response =
          await apiService.chat(

            [

              ...history,

              {

                role:
                  'system',

                content:
                  JSON.stringify(
                    interviewContext
                  )
              }
            ],

            medicalMemory,

            lastAnalysis
          );

        const {

          text: aiText,

          decision,

          updatedMemory,

          lastAnalysis: updatedAnalysis,

          quickReplies,

          interviewCompleted

        } = response;

        // -----------------------------------
        // SAVE ASKED QUESTION
        // -----------------------------------

        if (

          decision?.mode ===
          'CLARIFICATION_MODE'

        ) {

          addAskedQuestion(
            aiText
          );
        }

        // -----------------------------------
        // MEMORY
        // -----------------------------------

        if (updatedMemory) {

          setMedicalMemory(
            updatedMemory
          );
        }

        // -----------------------------------
        // ANALYSIS
        // -----------------------------------

        if (updatedAnalysis) {

          setLastAnalysis(
            updatedAnalysis
          );
        }

        // -----------------------------------
        // QUICK REPLIES
        // -----------------------------------

        let finalQuickReplies =

          Array.isArray(
            quickReplies
          )

            ? quickReplies

            : [];

        // -----------------------------------
        // FALLBACK ACTIONS
        // -----------------------------------

        if (

          interviewCompleted

          &&

          finalQuickReplies.length === 0

        ) {

          finalQuickReplies = [

            '📄 Создать отчет',

            '🩻 Загрузить МРТ',

            '🧪 Прикрепить анализы',

            '📷 Загрузить фото',

            '➕ Добавить симптомы'
          ];
        }

        // -----------------------------------
        // INTERVIEW COMPLETE
        // -----------------------------------

        if (interviewCompleted) {

          updateInterviewState({

            interviewCompleted:
              true
          });
        }

        // -----------------------------------
        // AI DATA
        // -----------------------------------

        const aiData: AIResponse = {

          summary:

            decision?.mode ===
            'CLARIFICATION_MODE'

              ? ''

              : aiText,

          message:
            aiText,

          probableDiagnoses: [],

          reasoning: [],

          risks: [],

          recommendations: [],

          medications: [],

          suggested_actions: [],

          quick_replies:
            finalQuickReplies,

          interviewCompleted:
            interviewCompleted,

          danger_level:

            decision?.emergencyLevel

            || 'low',

          render_mode:
            decision?.mode,

          router_decision:
            decision
        };

        const assistantMessage: Message = {

          id:
            nanoid(),

          role:
            'assistant',

          content:
            aiText,

          timestamp:
            Date.now(),

          ai_data:
            aiData
        };

        addMessage(
          assistantMessage
        );

      } catch (err: any) {

        console.error(err);

        const errorMessage =

          typeof err?.message === 'string'

            ? err.message

            : 'Произошла ошибка при обработке запроса';

        setError(
          errorMessage
        );

      } finally {

        setLoading(false);
      }

    }, [

      messages,

      addMessage,

      updateMessage,

      setLoading,

      setError,

      setMedicalMemory,

      setLastAnalysis,

      medicalInterviewState
    ]);

  return (

    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-2xl relative overflow-hidden">

      <AnimatePresence>

        {error && (

          <motion.div

            initial={{
              opacity: 0,
              y: -20
            }}

            animate={{
              opacity: 1,
              y: 0
            }}

            exit={{
              opacity: 0,
              y: -20
            }}

            className="absolute top-20 left-4 right-4 z-50 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between"
          >

            <div className="flex items-center gap-2">

              <ShieldAlert
                size={18}
              />

              <p className="text-sm font-medium">
                {error}
              </p>

            </div>

            <button

              onClick={() =>
                setError(null)
              }

              className="text-red-500 hover:text-red-700"
            >

              <Trash2 size={16} />

            </button>

          </motion.div>
        )}

      </AnimatePresence>

      <header className="px-5 py-4 bg-teal-600 border-b border-teal-700/50 flex items-center justify-between z-20 shadow-md">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-sm">

            <Bot
              size={21}
              className="text-white"
            />

          </div>

          <div>

            <h1 className="text-base font-bold text-white tracking-tight">
              AI Медицинский Ассистент
            </h1>

            <div className="flex items-center gap-1.5">

              <div className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-pulse shadow-sm shadow-teal-300/50" />

              <span className="text-[10px] text-teal-50/70 font-bold uppercase tracking-widest">

                Ассистент онлайн

              </span>

            </div>

          </div>

        </div>

        <div className="flex gap-2">

          <Button

            variant="ghost"

            className="flex items-center gap-2 px-3 text-teal-50 hover:bg-white/10 hover:text-white transition-all rounded-xl"

            onClick={clearHistory}
          >

            <Trash2 size={16} />

            <span className="hidden sm:inline text-xs font-bold uppercase tracking-tight">

              Очистить

            </span>

          </Button>

        </div>

      </header>

      <div className="bg-amber-50 px-4 py-1.5 flex items-center justify-center gap-2 border-b border-amber-100 z-10">

        <ShieldAlert
          size={12}
          className="text-amber-500"
        />

        <span className="text-[10px] text-amber-700 font-medium">

          Это не заменяет консультацию врача

        </span>

      </div>

      <main className="flex-1 flex flex-col relative min-h-0">

        <MessageList

          messages={messages}

          isLoading={isLoading}
        />

      </main>

      <footer className="relative z-20">

        <ChatInput

          onSend={handleSendMessage}

          isLoading={isLoading}

          suggestions={
            lastAiResponse
              ?.quick_replies
          }
        />

      </footer>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-teal-400/5 blur-[100px] rounded-full pointer-events-none" />

    </div>
  );
}