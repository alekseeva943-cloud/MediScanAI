// src/components/ChatInput.tsx

import {
  useState,
  useRef
} from 'react';

import {
  Camera,
  Mic,
  Send,
  X,
  Loader2,
  StopCircle,
  Paperclip
} from 'lucide-react';

import {
  Button,
  Input
} from './UI';

import {
  motion,
  AnimatePresence
} from 'motion/react';

import { cn } from '../lib/utils';

import { useChatStore } from '../store/useChatStore';

import { CameraModal } from './CameraModal';

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

  onSend: (
    text: string,
    image?: string,
    audioBlob?: Blob
  ) => void;

  isLoading: boolean;

  suggestions?: string[];
}

export const ChatInput = ({
  onSend,
  isLoading,
  suggestions
}: ChatInputProps) => {

  const setLoading =
    useChatStore(state => state.setLoading);

  const [text, setText] =
    useState('');

  const [image, setImage] =
    useState<string | null>(null);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isTranscribing, setIsTranscribing] =
    useState(false);

  const [isCameraOpen, setIsCameraOpen] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  // -------------------------
  // SUBMIT
  // -------------------------

  const handleSubmit = (
    e?: React.FormEvent
  ) => {

    e?.preventDefault();

    if (
      (!text.trim() && !image) ||
      isLoading
    ) {
      return;
    }

    onSend(
      text,
      image || undefined
    );

    setText('');

    setImage(null);
  };

  // -------------------------
  // IMAGE
  // -------------------------

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onloadend = () => {

      setImage(
        reader.result as string
      );

      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  // -------------------------
  // VOICE
  // -------------------------

  const startRecording = async () => {

    try {

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true
          });

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : '';

      const options =
        mimeType
          ? { mimeType }
          : {};

      const mediaRecorder =
        new MediaRecorder(
          stream,
          options
        );

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable =
        (event) => {

          if (event.data.size > 0) {

            audioChunksRef.current.push(
              event.data
            );
          }
        };

      mediaRecorder.onstop = () => {

        if (
          audioChunksRef.current.length > 0
        ) {

          const blobMime =
            mimeType || 'audio/webm';

          const audioBlob =
            new Blob(
              audioChunksRef.current,
              {
                type: blobMime
              }
            );

          if (audioBlob.size > 500) {

            onSend(
              '',
              undefined,
              audioBlob
            );
          }
        }

        setIsRecording(false);

        stream
          .getTracks()
          .forEach(track =>
            track.stop()
          );
      };

      mediaRecorder.start();

      setIsRecording(true);

    } catch (err) {

      console.error(
        'Recording error:',
        err
      );

      alert(
        'Нет доступа к микрофону'
      );
    }
  };

  const stopRecording = () => {

    mediaRecorderRef
      .current
      ?.stop();

    setIsRecording(false);
  };

  // -------------------------
  // QUICK REPLIES
  // -------------------------

  const interviewState =
    useChatStore(state => state.interviewState);

  const setInterviewState =
    useChatStore(state => state.setInterviewState);

  const handleSuggestionClick = (
    suggestion: string
  ) => {

    // -------------------------
    // SKIP QUESTION
    // -------------------------

    if (
      suggestion === 'Пропустить'
      &&
      interviewState.active
    ) {

      const currentStep =
        interviewState.currentStep || 1;

      setInterviewState({

        currentStep:
          currentStep + 1
      });

      onSend('__SKIP__');

      return;
    }

    // -------------------------
    // NORMAL ANSWER
    // -------------------------

    onSend(suggestion);
  };

  return (

    <div className="p-4 bg-white border-t border-slate-100 space-y-4">

      {/* SUGGESTIONS */}

      <AnimatePresence>

        {suggestions &&
          suggestions.length > 0 &&
          !isLoading && (

            <motion.div

              initial={{
                opacity: 0,
                y: 10
              }}

              animate={{
                opacity: 1,
                y: 0
              }}

              exit={{
                opacity: 0,
                y: 10
              }}

              className="space-y-3"
            >

              {/* HEADER */}

              <div className="flex items-center justify-between px-1">

                <div className="flex flex-col">

                  <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                    Подсказки
                  </span>

                  <span className="text-sm text-slate-500 mt-1">
                    Выберите вариант или продолжите сообщение
                  </span>
                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex flex-wrap gap-2 pb-1">

                {suggestions
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((s, i) => (

                    <Button

                      key={i}

                      variant="secondary"

                      className="whitespace-nowrap rounded-full py-1.5 px-4 h-auto text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"

                      onClick={() =>
                        handleSuggestionClick(s)
                      }
                    >
                      {s}
                    </Button>
                  ))}
              </div>

            </motion.div>
          )}
      </AnimatePresence>

      {/* CAMERA */}

      <CameraModal

        isOpen={isCameraOpen}

        onClose={() =>
          setIsCameraOpen(false)
        }

        onCapture={(dataUrl) =>
          setImage(dataUrl)
        }
      />

      {/* IMAGE PREVIEW */}

      {image && (

        <div className="relative inline-block">

          <img

            src={image}

            alt="Preview"

            className="w-20 h-20 object-cover rounded-xl border-2 border-indigo-200"
          />

          <button

            onClick={() =>
              setImage(null)
            }

            className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-slate-900"
          >

            <X size={12} />

          </button>
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="flex gap-1.5 items-center"
      >

        {/* FILE */}

        <input

          type="file"

          accept="image/*"

          className="hidden"

          ref={fileInputRef}

          onChange={handleImageUpload}
        />

        {/* FILE BUTTON */}

        <Button

          type="button"

          variant="ghost"

          className="rounded-full w-11 h-11 p-0 shrink-0"

          onClick={() =>
            fileInputRef.current?.click()
          }

          disabled={
            isLoading ||
            isRecording
          }

          title="Загрузить файл"
        >

          <Paperclip
            size={20}
            className="text-slate-500"
          />

        </Button>

        {/* CAMERA BUTTON */}

        <Button

          type="button"

          variant="ghost"

          className="rounded-full w-11 h-11 p-0 shrink-0"

          onClick={() =>
            setIsCameraOpen(true)
          }

          disabled={
            isLoading ||
            isRecording
          }

          title="Сделать фото"
        >

          <Camera
            size={20}
            className="text-slate-500"
          />

        </Button>

        {/* INPUT */}

        <div className="relative flex-1">

          <Input

            value={text}

            onChange={(e) =>
              setText(e.target.value)
            }

            placeholder={
              isRecording
                ? "Слушаю вас..."
                : "Опишите симптомы или задайте вопрос..."
            }

            disabled={
              isLoading ||
              isRecording ||
              isTranscribing
            }

            className={cn(
              "pr-12 rounded-full h-11",
              isRecording &&
              "pl-12 border-red-200 bg-red-50/30"
            )}
          />

          {isRecording && (

            <div className="absolute left-4 top-1/2 -translate-y-1/2">

              <VoiceWaveform />

            </div>
          )}

          {isTranscribing && (

            <div className="absolute right-4 top-1/2 -translate-y-1/2">

              <Loader2
                size={18}
                className="animate-spin text-indigo-500"
              />

            </div>
          )}
        </div>

        {/* VOICE */}

        <Button

          type="button"

          variant={
            isRecording
              ? "danger"
              : "ghost"
          }

          className={cn(
            "rounded-full w-11 h-11 p-0 shrink-0",
            isRecording &&
            "animate-pulse"
          )}

          onClick={
            isRecording
              ? stopRecording
              : startRecording
          }

          disabled={
            isLoading ||
            isTranscribing
          }

          title={
            isRecording
              ? "Остановить"
              : "Голосовой поиск"
          }
        >

          {isRecording
            ? <StopCircle size={20} />
            : (
              <Mic
                size={20}
                className="text-slate-500"
              />
            )}
        </Button>

        {/* SEND */}

        <Button

          type="submit"

          className="rounded-full w-11 h-11 p-0 shrink-0 shadow-lg shadow-teal-100 bg-teal-600 hover:bg-teal-700 text-white"

          disabled={
            (!text.trim() && !image) ||
            isLoading ||
            isRecording
          }
        >

          <Send size={20} />

        </Button>

      </form>
    </div>
  );
};