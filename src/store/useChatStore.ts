import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Message } from '../types';

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      status: null,
      error: null,
      addMessage: (message) => 
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      setLoading: (loading, status = null) => set({ isLoading: loading, status: status }),
      setError: (error) => set({ error: error }),
      clearHistory: () => set({ messages: [], isLoading: false, status: null, error: null }),
    }),
    {
      name: 'medical-ai-chat-history',
    }
  )
);
