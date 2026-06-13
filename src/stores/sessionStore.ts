import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, Message } from '../types';
import { localStorageAdapter } from '../lib/storage';

export interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  isStreaming: boolean;
  createSession: () => string;
  selectSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  clearSession: (id: string) => void;
  exportSessions: () => string;
  importSessions: (data: string) => void;
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
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,

      createSession: () => {
        const session = createEmptySession();
        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSessionId: session.id,
        }));
        return session.id;
      },

      selectSession: (id) => set({ currentSessionId: id }),

      renameSession: (id, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title } : s
          ),
        })),

      deleteSession: (id) =>
        set((state) => {
          const index = state.sessions.findIndex((s) => s.id === id);
          const remaining = state.sessions.filter((s) => s.id !== id);
          let nextId: string | null = state.currentSessionId;
          if (state.currentSessionId === id) {
            const nextSession = remaining[index] ?? remaining[index - 1] ?? remaining[0];
            nextId = nextSession?.id ?? null;
          }
          return { sessions: remaining, currentSessionId: nextId };
        }),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, message],
                  updatedAt: Date.now(),
                  title:
                    s.title === 'New Chat' && message.role === 'user'
                      ? message.content.slice(0, 30)
                      : s.title,
                }
              : s
          ),
        })),

      updateMessage: (sessionId, messageId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        })),

      clearSession: (id) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id
              ? { ...s, messages: [], title: 'New Chat', updatedAt: Date.now() }
              : s
          ),
        })),

      exportSessions: () => JSON.stringify({ sessions: get().sessions }, null, 2),

      importSessions: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (!Array.isArray(parsed.sessions)) return;
          const validSessions = (parsed.sessions as unknown[]).filter(
            (s): s is Session => {
              const maybeSession = s as Record<string, unknown>;
              return (
                maybeSession !== null &&
                typeof maybeSession === 'object' &&
                typeof maybeSession.id === 'string' &&
                typeof maybeSession.title === 'string' &&
                Array.isArray(maybeSession.messages) &&
                typeof maybeSession.createdAt === 'number' &&
                typeof maybeSession.updatedAt === 'number'
              );
            }
          );
          const seen = new Set<string>();
          const deduped = validSessions.filter((s: Session) => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
          });
          set({
            sessions: deduped,
            currentSessionId: deduped[0]?.id ?? null,
          });
        } catch (e) {
          console.warn('Failed to import sessions:', e);
        }
      },

      setStreaming: (value) => set({ isStreaming: value }),
    }),
    {
      name: 'arona-sessions',
      storage: localStorageAdapter as any,
    }
  )
);
