// src/App.tsx

import { useCallback, useMemo } from 'react';

import { useChatStore } from './store/useChatStore';

import { MessageList } from './components/MessageList';

import { ChatInput } from './components/ChatInput';

import { apiService } from './services/apiService';

import { nanoid } from 'nanoid';

import { AIResponse, Message } from './types';

import {
  Bot,
  Trash2,
  ShieldAlert
} from 'lucide-react';

import { Button } from './components/UI';

import {
  AnimatePresence,
  motion
} from 'motion/react';

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

    resetInterview,

    interviewState,

    setInterviewState

  } = useChatStore();

  const lastAiResponse = useMemo(() => {

    const aiMessages =
      messages.filter(
        m => m.role === 'assistant'
      );

    return aiMessages[
      aiMessages.length - 1
    ]?.ai_data;

  }, [messages]);

  // -------------------------
  // SYMPTOM FLOWS
  // -------------------------

  const symptomFlows = {

    knee: [

      {
        id: 'pain_start',
        question: 'Когда началась боль?',
        replies: [
          'Сегодня',
          'Вчера',
          'Несколько дней',
          'После тренировки',
          'Давно',
          'Пропустить'
        ]
      },

      {
        id: 'pain_type',
        question: 'Какая это боль?',
        replies: [
          'Острая',
          'Ноющая',
          'Тянущая',
          'Пульсирующая',
          'Только при движении',
          'Пропустить'
        ]
      },

      {
        id: 'swelling',
        question: 'Есть ли отек?',
        replies: [
          'Да',
          'Нет',
          'Немного',
          'Сильный',
          'Пропустить'
        ]
      },

      {
        id: 'injury',
        question: 'Была ли травма?',
        replies: [
          'Да',
          'Нет',
          'После спорта',
          'После падения',
          'После нагрузки',
          'Пропустить'
        ]
      }
    ],

    rectal: [

      {
        id: 'burning',
        question: 'Есть жжение или зуд?',
        replies: [
          'Да',
          'Нет',
          'Сильное жжение',
          'Только после туалета',
          'Пропустить'
        ]
      },

      {
        id: 'blood',
        question: 'Есть кровь?',
        replies: [
          'Да',
          'Нет',
          'Немного',
          'Яркая кровь',
          'Темная кровь',
          'Пропустить'
        ]
      },

      {
        id: 'spicy_food',
        question: 'Ели острое или алкоголь?',
        replies: [
          'Острое',
          'Алкоголь',
          'И то и другое',
          'Нет',
          'Пропустить'
        ]
      }
    ],

    stomach: [

      {
        id: 'nausea',
        question: 'Есть тошнота?',
        replies: [
          'Да',
          'Нет',
          'Иногда',
          'После еды',
          'Пропустить'
        ]
      },

      {
        id: 'temperature',
        question: 'Есть температура?',
        replies: [
          'Нет',
          '37-38',
          '38+',
          'Не измерял',
          'Пропустить'
        ]
      }
    ],

    default: [

      {
        id: 'details',
        question: 'Расскажите подробнее о симптомах',
        replies: [
          'Добавить детали',
          'Есть анализы',
          'Загрузить фото',
          'Пропустить'
        ]
      }
    ]
  };

  // -------------------------
  // DETECT SYMPTOM TYPE
  // -------------------------

  const detectSymptomType = (
    input: string
  ) => {

    const lower =
      input.toLowerCase();

    if (

      lower.includes('колен')

      ||

      lower.includes('нога')

      ||

      lower.includes('сустав')

    ) {

      return 'knee';
    }

    if (

      lower.includes('очко')

      ||

      lower.includes('анус')

      ||

      lower.includes('жоп')

      ||

      lower.includes('зад')

      ||

      lower.includes('горит')

    ) {

      return 'rectal';
    }

    if (

      lower.includes('живот')

      ||

      lower.includes('желуд')

      ||

      lower.includes('тошнит')

    ) {

      return 'stomach';
    }

    return 'default';
  };

  // -------------------------
  // NEXT QUESTION
  // -------------------------

  const getNextQuestion = (
    symptomType: string
  ) => {

    const flow =

      symptomFlows[
        symptomType as keyof typeof symptomFlows
      ]

      ||

      symptomFlows.default;

    const asked =
      interviewState?.askedQuestions || [];

    return flow.find(
      q => !asked.includes(q.id)
    );
  };

  // -------------------------
  // SEND MESSAGE
  // -------------------------

  const handleSendMessage = useCallback(async (

    text: string,

    image?: string,

    audioBlob?: Blob

  ) => {

    if (
      !text.trim() &&
      !image &&
      !audioBlob
    ) {
      return;
    }

    const messageId = nanoid();

    const userMessage: Message = {

      id: messageId,

      role: 'user',

      content:
        text ||
        (
          audioBlob
            ? 'Голосовое сообщение...'
            : ''
        ),

      timestamp: Date.now(),

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

            : undefined,
    };

    addMessage(userMessage);

    setError(null);

    try {

      let finalContent = text;

      // -------------------------
      // VOICE
      // -------------------------

      if (audioBlob) {

        try {

          finalContent =
            await apiService.transcribeVoice(
              audioBlob
            );

          if (
            useChatStore
              .getState()
              .messages.length > 0
          ) {

            updateMessage(
              messageId,
              {
                content: finalContent
              }
            );

          } else {

            return;
          }

        } catch (err: any) {

          if (
            useChatStore
              .getState()
              .messages.length > 0
          ) {

            updateMessage(
              messageId,
              {
                content:
                  '⚠️ Не удалось расшифровать голос.'
              }
            );
          }

          throw err;
        }
      }

      // -------------------------
      // LOCAL INTERVIEW FLOW
      // -------------------------

      if (
        interviewState.active
      ) {

        const currentType =
          interviewState.symptomContext || 'default';

        const currentFlow =

          symptomFlows[
            currentType as keyof typeof symptomFlows
          ]

          ||

          symptomFlows.default;

        const currentQuestion =
          currentFlow[
            interviewState.currentStep
          ];

        const updatedAsked = [

          ...(interviewState.askedQuestions || []),

          currentQuestion?.id
        ];

        const nextQuestion =
          currentFlow.find(
            q => !updatedAsked.includes(q.id)
          );

        // -------------------------
        // SAVE ANSWER
        // -------------------------

        setInterviewState({

          askedQuestions:
            updatedAsked,

          collectedAnswers: [

            {
              question:
                currentQuestion?.question,

              answer: text
            }
          ],

          skippedQuestions:

            text === 'Пропустить'

              ? [
                currentQuestion?.id
              ]

              : []
        });

        // -------------------------
        // FINISH FLOW
        // -------------------------

        if (!nextQuestion) {

          resetInterview();

          const assistantMessage: Message = {

            id: nanoid(),

            role: 'assistant',

            content:
              'Спасибо. Информации достаточно для предварительной оценки.',

            timestamp: Date.now(),

            ai_data: {

              summary:
                'Спасибо. Информации достаточно для предварительной оценки.',

              possible_risks: [],

              recommendations: [],

              danger_level: 'low',

              suggested_actions: [],

              quick_replies: [
                'Показать предварительный отчет',
                'Добавить симптомы',
                'Загрузить фото',
                'Прикрепить анализы'
              ],

              medical_warning: '',

              render_mode:
                'PRELIMINARY_ANALYSIS'
            }
          };

          addMessage(
            assistantMessage
          );

          return;
        }

        // -------------------------
        // NEXT QUESTION
        // -------------------------

        setInterviewState({

          currentStep:
            interviewState.currentStep + 1,

          currentQuestion:
            nextQuestion.question
        });

        const assistantMessage: Message = {

          id: nanoid(),

          role: 'assistant',

          content:
            nextQuestion.question,

          timestamp: Date.now(),

          ai_data: {

            summary:
              nextQuestion.question,

            possible_risks: [],

            recommendations: [],

            danger_level: 'low',

            suggested_actions: [],

            quick_replies:
              nextQuestion.replies,

            medical_warning: '',

            render_mode:
              'CLARIFICATION_MODE'
          }
        };

        addMessage(
          assistantMessage
        );

        return;
      }

      // -------------------------
      // START INTERVIEW
      // -------------------------

      const symptomType =
        detectSymptomType(
          finalContent
        );

      const firstQuestion =
        getNextQuestion(
          symptomType
        );

      if (
        firstQuestion &&
        symptomType !== 'default'
      ) {

        setInterviewState({

          active: true,

          currentStep: 0,

          totalSteps:

            symptomFlows[
              symptomType as keyof typeof symptomFlows
            ].length,

          currentQuestion:
            firstQuestion.question,

          askedQuestions: [],

          collectedAnswers: [],

          skippedQuestions: [],

          symptomContext:
            symptomType
        });

        const assistantMessage: Message = {

          id: nanoid(),

          role: 'assistant',

          content:
            firstQuestion.question,

          timestamp: Date.now(),

          ai_data: {

            summary:
              firstQuestion.question,

            possible_risks: [],

            recommendations: [],

            danger_level: 'low',

            suggested_actions: [],

            quick_replies:
              firstQuestion.replies,

            medical_warning: '',

            render_mode:
              'CLARIFICATION_MODE'
          }
        };

        addMessage(
          assistantMessage
        );

        return;
      }

      // -------------------------
      // API
      // -------------------------

      setLoading(
        true,
        image
          ? 'Анализ изображения'
          : 'Подготовка ответа'
      );

      const history =
        useChatStore
          .getState()
          .messages
          .map(m => ({
            role: m.role,
            content: m.content
          }));

      const medicalMemory =
        useChatStore
          .getState()
          .medicalMemory;

      const lastAnalysis =
        useChatStore
          .getState()
          .lastAnalysis;

      const {

        text: aiText,

        decision,

        updatedMemory,

        lastAnalysis: updatedAnalysis

      } = await apiService.chat(

        history,

        medicalMemory,

        lastAnalysis
      );

      if (updatedMemory) {

        setMedicalMemory(
          updatedMemory
        );
      }

      if (updatedAnalysis) {

        setLastAnalysis(
          updatedAnalysis
        );
      }

      let aiData: AIResponse = {

        summary: aiText,

        possible_risks: [],

        recommendations: [],

        danger_level:
          decision?.emergencyLevel || 'low',

        suggested_actions: [],

        quick_replies: [],

        medical_warning: '',

        render_mode:
          decision?.mode,

        router_decision:
          decision
      };

      const assistantMessage: Message = {

        id: nanoid(),

        role: 'assistant',

        content: aiText,

        timestamp: Date.now(),

        ai_data: aiData
      };

      addMessage(
        assistantMessage
      );

    } catch (err: any) {

      const errorMessage =

        typeof err.message === 'string'

          ? err.message

          : 'Произошла неизвестная ошибка';

      setError(errorMessage);

      console.error(err);

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

    resetInterview,

    interviewState,

    setInterviewState
  ]);

  return (

    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-2xl relative overflow-hidden">

      {/* ERROR */}

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

            className="absolute top-20 left-4 right-4 z-50 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg flex items-center justify-between"
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

      {/* HEADER */}

      <header className="px-5 py-4 bg-teal-600 border-b border-teal-700/50 flex items-center justify-between z-20 shadow-md">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-sm">

            <Bot
              size={20}
              className="text-white"
            />

          </div>

          <div>

            <h1 className="text-base font-bold text-white tracking-tight">
              AI Фармацевт
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

      {/* WARNING */}

      <div className="bg-amber-50 px-4 py-1.5 flex items-center justify-center gap-2 border-b border-amber-100 z-10">

        <ShieldAlert
          size={12}
          className="text-amber-500"
        />

        <span className="text-[10px] text-amber-700 font-medium">
          Это не заменяет консультацию врача
        </span>
      </div>

      {/* CHAT */}

      <main className="flex-1 flex flex-col relative min-h-0">

        <MessageList

          messages={messages}

          isLoading={isLoading}
        />

      </main>

      {/* INPUT */}

      <footer className="relative z-20">

        <ChatInput

          onSend={handleSendMessage}

          isLoading={isLoading}

          suggestions={
            lastAiResponse?.quick_replies
          }
        />

      </footer>

      {/* BACKGROUND */}

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[30%] bg-teal-400/5 blur-[100px] rounded-full pointer-events-none" />

    </div>
  );
}