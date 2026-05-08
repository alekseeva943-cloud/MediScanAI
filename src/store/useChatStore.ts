import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Message } from '../types';

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,
      addMessage: (message) => 
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),
      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'medical-ai-chat-history',
    }
  )
);
