import { create } from 'zustand';
import type { Session, Message } from '../types';

export interface SessionState {
  currentSession: Session | null;
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearChat: () => void;
  setStreaming: (value: boolean) => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const createEmptySession = (): Session => ({
  id: generateId(),
  title: 'New Chat',
  summary: 'No messages',
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  titleGenerated: true,
  summaryGenerated: true,
});

export const useSessionStore = create<SessionState>()((set) => ({
  currentSession: createEmptySession(),
  isStreaming: false,

  addMessage: (message) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          messages: [...state.currentSession.messages, message],
          updatedAt: Date.now(),
        },
      };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          messages: state.currentSession.messages.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
          updatedAt: Date.now(),
        },
      };
    }),

  deleteMessage: (messageId) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          messages: state.currentSession.messages.filter((m) => m.id !== messageId),
          updatedAt: Date.now(),
        },
      };
    }),

  clearChat: () => set({ currentSession: createEmptySession() }),

  setStreaming: (value) => set({ isStreaming: value }),
}));
