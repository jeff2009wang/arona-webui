# Remove Conversation Storage System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove client-side conversation persistence and multi-session management, leaving only a single ephemeral in-memory chat with a clear-chat action.

**Architecture:** `sessionStore` collapses from a persisted list of sessions to a single in-memory `currentSession`. The HistoryPanel, import/export, and session metadata UI are removed. Layouts become single-column. `useLLM` operates directly on the current session without `sessionId`. Hermes still receives `session_id` and `conversation_history` from the ephemeral session.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, Vitest, Tailwind CSS.

---

## Task 1: Refactor `sessionStore` to a single ephemeral session

**Files:**
- Modify: `src/stores/sessionStore.ts`
- Test: `src/stores/__tests__/sessionStore.test.ts`

### Step 1.1: Replace `sessionStore.ts` with the single-session version

Replace the entire file with:

```ts
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
```

### Step 1.2: Rewrite `sessionStore.test.ts`

Replace the entire file with:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      currentSession: null,
      isStreaming: false,
    });
  });

  it('initializes with a single empty session', () => {
    // Re-create store state by directly setting a fresh empty session
    useSessionStore.getState().clearChat();
    const session = useSessionStore.getState().currentSession;
    expect(session).not.toBeNull();
    expect(session!.messages).toHaveLength(0);
    expect(session!.title).toBe('New Chat');
  });

  it('adds a message to the current session', () => {
    useSessionStore.getState().clearChat();
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    expect(useSessionStore.getState().currentSession!.messages).toHaveLength(1);
    expect(useSessionStore.getState().currentSession!.messages[0].content).toBe('hello');
  });

  it('updates a message by id', () => {
    useSessionStore.getState().clearChat();
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().updateMessage('m1', { content: 'updated' });
    expect(useSessionStore.getState().currentSession!.messages[0].content).toBe('updated');
  });

  it('deletes a message by id', () => {
    useSessionStore.getState().clearChat();
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().deleteMessage('m1');
    expect(useSessionStore.getState().currentSession!.messages).toHaveLength(0);
  });

  it('clearChat resets messages and changes session id', () => {
    useSessionStore.getState().clearChat();
    const firstId = useSessionStore.getState().currentSession!.id;
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().clearChat();
    const secondId = useSessionStore.getState().currentSession!.id;
    expect(secondId).not.toBe(firstId);
    expect(useSessionStore.getState().currentSession!.messages).toHaveLength(0);
  });

  it('setStreaming toggles streaming flag', () => {
    useSessionStore.getState().setStreaming(true);
    expect(useSessionStore.getState().isStreaming).toBe(true);
    useSessionStore.getState().setStreaming(false);
    expect(useSessionStore.getState().isStreaming).toBe(false);
  });
});
```

### Step 1.3: Run the store tests

Run:

```bash
npm test -- src/stores/__tests__/sessionStore.test.ts --run
```

Expected: all tests pass.

### Step 1.4: Commit

```bash
git add src/stores/sessionStore.ts src/stores/__tests__/sessionStore.test.ts
git commit -m "refactor(store): single ephemeral session, remove persistence and multi-session APIs"
```

---

## Task 2: Update UI store and layout components

**Files:**
- Modify: `src/stores/uiStore.ts`
- Modify: `src/components/layout/DesktopLayout.tsx`
- Modify: `src/components/layout/MobileLayout.tsx`
- Modify: `src/App.tsx`

### Step 2.1: Simplify `uiStore.ts`

Replace with:

```ts
import { create } from 'zustand';

type MobileTab = 'chat' | 'settings';

export interface UIState {
  activeMobileTab: MobileTab;
  isSettingsOpen: boolean;
  setActiveMobileTab: (tab: MobileTab) => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetUI: () => void;
}

const initialState = {
  activeMobileTab: 'chat' as MobileTab,
  isSettingsOpen: false,
};

export const useUIStore = create<UIState>()((set) => ({
  ...initialState,
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  resetUI: () => set(initialState),
}));
```

### Step 2.2: Make `DesktopLayout` single-column

Replace with:

```tsx
import { type ReactNode } from 'react';

export function DesktopLayout({ chat }: { chat: ReactNode }) {
  return (
    <div className="hidden lg:grid lg:grid-cols-1 gap-3 p-4 h-screen">
      {/* HUD corner decorations */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0, width: 72, height: 72,
          borderRight: '1px solid rgba(69,200,255,0.15)',
          borderBottom: '1px solid rgba(69,200,255,0.15)',
          zIndex: 3, pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, right: 0, width: 72, height: 72,
          borderLeft: '1px solid rgba(69,200,255,0.15)',
          borderBottom: '1px solid rgba(69,200,255,0.15)',
          zIndex: 3, pointerEvents: 'none',
        }}
      />
      <main className="h-full overflow-hidden">{chat}</main>
    </div>
  );
}
```

### Step 2.3: Remove history tab from `MobileLayout`

Replace with:

```tsx
import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { MessageSquare, Settings } from 'lucide-react';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
] as const;

export function MobileLayout({
  chat,
  settings,
}: {
  chat: ReactNode;
  settings: ReactNode;
}) {
  const activeMobileTab = useUIStore((s) => s.activeMobileTab);
  const setActiveMobileTab = useUIStore((s) => s.setActiveMobileTab);

  return (
    <div className="lg:hidden flex flex-col h-screen">
      <div className="flex-1 overflow-hidden p-3 relative">
        <div hidden={activeMobileTab !== 'chat'} className="h-full">{chat}</div>
        <div hidden={activeMobileTab !== 'settings'} className="h-full">{settings}</div>
      </div>
      <nav
        aria-label="Mobile tabs"
        className="flex justify-around items-center py-2 pb-4 border-t border-[var(--line)] bg-[var(--card)] backdrop-blur-md"
      >
        <div role="tablist" className="flex justify-around w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeMobileTab === tab.id}
              aria-label={tab.label}
              onClick={() => setActiveMobileTab(tab.id)}
              className={`flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none ${
                activeMobileTab === tab.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg grid place-items-center ${
                  activeMobileTab === tab.id
                    ? 'bg-gradient-to-br from-[var(--bubble-user-from)] to-[var(--bubble-user-to)] text-white'
                    : 'bg-[var(--tool-bg)] border border-[var(--line)]'
                }`}
              >
                <tab.icon size={12} />
              </div>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

### Step 2.4: Remove `HistoryPanel` from `App.tsx`

Replace with:

```tsx
import { ThemeProvider } from './components/layout/ThemeProvider';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatFrame } from './components/chat/ChatFrame';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastProvider } from './hooks/useToast';

function MobileSettingsShortcut() {
  const openSettings = useUIStore((s) => s.openSettings);
  return (
    <div className="p-4 flex items-center justify-center h-full">
      <button
        onClick={openSettings}
        aria-label="Open settings"
        className="px-8 py-3 rounded-2xl text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
        style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', boxShadow: '0 4px 16px var(--shadow)' }}
      >
        Open Settings
      </button>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <DesktopLayout chat={<ChatFrame />} />
        <MobileLayout chat={<ChatFrame />} settings={<MobileSettingsShortcut />} />
        <SettingsModal />
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
```

Wait: `App.tsx` also imports `useSessionStore` and has the `useEffect` for creating sessions. Remove those. Also add `useUIStore` import for `MobileSettingsShortcut`.

Corrected `App.tsx`:

```tsx
import { ThemeProvider } from './components/layout/ThemeProvider';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatFrame } from './components/chat/ChatFrame';
import { SettingsModal } from './components/settings/SettingsModal';
import { useUIStore } from './stores/uiStore';
import { ToastProvider } from './hooks/useToast';

function MobileSettingsShortcut() {
  const openSettings = useUIStore((s) => s.openSettings);
  return (
    <div className="p-4 flex items-center justify-center h-full">
      <button
        onClick={openSettings}
        aria-label="Open settings"
        className="px-8 py-3 rounded-2xl text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
        style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', boxShadow: '0 4px 16px var(--shadow)' }}
      >
        Open Settings
      </button>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <DesktopLayout chat={<ChatFrame />} />
        <MobileLayout chat={<ChatFrame />} settings={<MobileSettingsShortcut />} />
        <SettingsModal />
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
```

### Step 2.5: Update `App.test.tsx`

Replace with:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('../components/layout/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/layout/DesktopLayout', () => ({
  DesktopLayout: () => <div data-testid="desktop-layout">Desktop</div>,
}));

vi.mock('../components/layout/MobileLayout', () => ({
  MobileLayout: ({ settings }: { settings: React.ReactNode }) => (
    <div data-testid="mobile-layout">
      <div data-testid="mobile-settings">{settings}</div>
    </div>
  ),
}));

vi.mock('../components/settings/SettingsModal', () => ({
  SettingsModal: () => <div data-testid="settings-modal">Settings</div>,
}));

vi.mock('../stores/sessionStore', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      currentSession: { id: 's1', messages: [] },
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      openSettings: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('App', () => {
  it('renders desktop and mobile layouts', () => {
    render(<App />);
    expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  });

  it('renders the settings modal', () => {
    render(<App />);
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('renders the mobile settings shortcut', () => {
    render(<App />);
    expect(screen.getByTestId('mobile-settings')).toBeInTheDocument();
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
  });
});
```

### Step 2.6: Run relevant tests

```bash
npm test -- src/App.test.tsx src/components/layout --run
```

Expected: all pass.

### Step 2.7: Commit

```bash
git add src/stores/uiStore.ts src/components/layout/DesktopLayout.tsx src/components/layout/MobileLayout.tsx src/App.tsx src/__tests__/App.test.tsx
git commit -m "feat(layout): single-column layout, remove history panel integration"
```

---

## Task 3: Delete HistoryPanel

**Files:**
- Delete: `src/components/panels/HistoryPanel.tsx`
- Delete: `src/components/panels/__tests__/HistoryPanel.test.tsx`

### Step 3.1: Delete the files

```bash
rm src/components/panels/HistoryPanel.tsx src/components/panels/__tests__/HistoryPanel.test.tsx
```

### Step 3.2: Verify no remaining imports

Run:

```bash
grep -r "HistoryPanel" src/ --include="*.ts" --include="*.tsx" || true
```

Expected: no output (or only in docs/specs).

### Step 3.3: Run full test suite to catch broken imports

```bash
npm test -- --run
```

Expected: failures in consumers of `HistoryPanel` and old `sessionStore` APIs.

### Step 3.4: Commit

```bash
git add -A
git commit -m "chore(panels): remove HistoryPanel and its tests"
```

---

## Task 4: Update `useLLM` hook

**Files:**
- Modify: `src/hooks/useLLM.ts`
- Test: `src/hooks/__tests__/useLLM.test.ts`

### Step 4.1: Replace `useLLM.ts`

```ts
import { useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { streamChatCompletion } from '../lib/llm';
import { streamHermesRunCompletion, isHermesBackend } from '../lib/hermes';
import { extractErrorMessage } from '../lib/error';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import type { Message, ToolCall } from '../types';

function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

export function useLLM() {
  const settings = useSettingsStore(
    useShallow((state) => ({
      baseUrl: state.baseUrl,
      apiKey: state.apiKey,
      model: state.model,
      temperature: state.temperature,
      maxTokens: state.maxTokens,
      systemPrompt: state.systemPrompt,
      persona: state.persona,
      enableCgBackground: state.enableCgBackground,
      backgroundOpacity: state.backgroundOpacity,
      backgroundBlur: state.backgroundBlur,
      autoSummarize: state.autoSummarize,
    }))
  );
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateMessage = useSessionStore((s) => s.updateMessage);
  const setStreaming = useSessionStore((s) => s.setStreaming);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const streamingToolsRef = useRef<
    Record<
      string,
      {
        id: string;
        name: string;
        arguments: string;
        status: ToolCall['status'];
        startedAt: number;
        finishedAt?: number;
      }
    >
  >({});
  const toolMessageIdRef = useRef<string | null>(null);

  const buildToolCalls = (): ToolCall[] => {
    return Object.values(streamingToolsRef.current).map((tc) => {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = tc.arguments ? JSON.parse(tc.arguments) : {};
      } catch {
        parsedArgs = {};
      }
      return {
        id: tc.id,
        name: tc.name || 'unknown',
        arguments: parsedArgs,
        status: tc.status,
        startedAt: tc.startedAt,
        finishedAt: tc.finishedAt,
      };
    });
  };

  const sendMessage = useCallback(
    async (content: string, images?: string[]) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      streamingToolsRef.current = {};
      toolMessageIdRef.current = null;

      const session = useSessionStore.getState().currentSession;
      if (!session) return;

      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content,
        images: images?.length ? images : undefined,
        createdAt: Date.now(),
      };

      addMessage(userMessage);

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      addMessage(assistantMessage);
      setStreaming(true);

      const contentRef = { current: '' };
      const reasoningRef = { current: '' };
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let streamErrored = false;
      activeRunIdRef.current = null;

      const syncToolMessage = () => {
        const toolCalls = buildToolCalls();
        if (toolCalls.length === 0) return;
        if (toolMessageIdRef.current) {
          updateMessage(toolMessageIdRef.current, { toolCalls });
        } else {
          const toolMessage: Message = {
            id: generateMessageId(),
            role: 'tool',
            content: '',
            createdAt: Date.now(),
            toolCalls,
          };
          toolMessageIdRef.current = toolMessage.id;
          addMessage(toolMessage);
        }
      };

      try {
        const streamMessages = session.messages.filter(
          (m) =>
            (m.role === 'user' || m.role === 'assistant' || m.role === 'tool') &&
            m.status !== 'error' &&
            (m.role !== 'assistant' || m.content.trim() !== '')
        );

        if (isHermesBackend(settings)) {
          await streamHermesRunCompletion({
            settings,
            messages: streamMessages,
            sessionId: session.id,
            onChunk: (chunk) => {
              contentRef.current += chunk;
              updateMessage(assistantMessage.id, {
                content: contentRef.current,
              });
            },
            onReasoningChunk: (chunk) => {
              const normalizedChunk = chunk.trim();
              const normalizedContent = contentRef.current.trim();
              if (
                normalizedChunk &&
                !normalizedContent.startsWith(normalizedChunk)
              ) {
                reasoningRef.current = chunk;
                updateMessage(assistantMessage.id, {
                  reasoning: reasoningRef.current,
                });
              }
            },
            onToolCall: (toolCall) => {
              streamingToolsRef.current[toolCall.id] = {
                id: toolCall.id,
                name: toolCall.name,
                arguments: toolCall.arguments,
                status: toolCall.status,
                startedAt: streamingToolsRef.current[toolCall.id]?.startedAt ?? Date.now(),
                finishedAt: toolCall.status !== 'running' ? Date.now() : undefined,
              };
              syncToolMessage();
            },
            onRunId: (runId) => {
              activeRunIdRef.current = runId;
            },
            signal: controller.signal,
          });
        } else {
          await streamChatCompletion({
            settings,
            messages: streamMessages,
            onChunk: (chunk) => {
              contentRef.current += chunk;
              updateMessage(assistantMessage.id, {
                content: contentRef.current,
              });
            },
            onReasoningChunk: (chunk) => {
              reasoningRef.current += chunk;
              updateMessage(assistantMessage.id, {
                reasoning: reasoningRef.current,
              });
            },
            onToolCall: (delta) => {
              const existing = streamingToolsRef.current[delta.id];
              if (existing) {
                existing.name = delta.name || existing.name;
                existing.arguments += delta.arguments;
              } else {
                streamingToolsRef.current[delta.id] = {
                  id: delta.id,
                  name: delta.name,
                  arguments: delta.arguments,
                  status: 'running',
                  startedAt: Date.now(),
                };
              }
              syncToolMessage();
            },
            signal: controller.signal,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User stopped — keep current content
        } else {
          streamErrored = true;
          const message = extractErrorMessage(error);
          console.error('[useLLM] stream error:', error);
          updateMessage(assistantMessage.id, {
            content: message,
            status: 'error',
          });
        }
      } finally {
        if (toolMessageIdRef.current) {
          const finalStatus: ToolCall['status'] = streamErrored ? 'error' : 'success';
          for (const tc of Object.values(streamingToolsRef.current)) {
            tc.status = finalStatus;
            tc.finishedAt = Date.now();
          }
          updateMessage(toolMessageIdRef.current, {
            toolCalls: buildToolCalls(),
          });
        }
        streamingToolsRef.current = {};
        toolMessageIdRef.current = null;
        activeRunIdRef.current = null;

        if (abortControllerRef.current === controller) {
          setStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [settings, addMessage, updateMessage, setStreaming]
  );

  const stop = useCallback(() => {
    const current = abortControllerRef.current;
    const runId = activeRunIdRef.current;
    if (current) {
      current.abort();
      if (abortControllerRef.current === current) {
        abortControllerRef.current = null;
        setStreaming(false);
      }
    }
    if (runId) {
      activeRunIdRef.current = null;
      fetch(`${settings.baseUrl.replace(/\/+$/, '')}/runs/${runId}/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
        },
      }).catch(() => {});
    }
  }, [setStreaming, settings.baseUrl, settings.apiKey]);

  return { sendMessage, stop };
}
```

### Step 4.2: Rewrite `useLLM.test.ts`

Replace with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLLM } from '../useLLM';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';

function createMockReader(chunks: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    read: () => {
      if (i >= chunks.length) return Promise.resolve({ done: true, value: undefined });
      return Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) });
    },
    releaseLock: vi.fn(),
  };
}

describe('useLLM', () => {
  beforeEach(() => {
    useSessionStore.setState({ currentSession: null, isStreaming: false });
    useSessionStore.getState().clearChat();
    useSettingsStore.getState().resetToDefaults();
    useSettingsStore.getState().updateConfig({
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    });
  });

  it('sends a message and streams assistant response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () =>
          createMockReader([
            'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
            'data: [DONE]\n\n',
          ]),
      },
    });

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages).toHaveLength(2);
      expect(session?.messages[0].role).toBe('user');
      expect(session?.messages[1].role).toBe('assistant');
      expect(session?.messages[1].content).toBe('Hello!');
    });
  });

  it('streams reasoning content into the assistant message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () =>
          createMockReader([
            'data: {"choices":[{"delta":{"reasoning_content":"Let"}}]}\n\n',
            'data: {"choices":[{"delta":{"reasoning_content":" me think."}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"Done"}}]}\n\n',
            'data: [DONE]\n\n',
          ]),
      },
    });

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages[1].role).toBe('assistant');
      expect(session?.messages[1].reasoning).toBe('Let me think.');
      expect(session?.messages[1].content).toBe('Done');
    });
  });

  it('handles non-Error rejections without showing generic "Unknown error"', async () => {
    global.fetch = vi.fn().mockRejectedValue('connection refused');

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages[1].status).toBe('error');
      expect(session?.messages[1].content).toBe('connection refused');
    });
  });

  it('handles HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages[1].status).toBe('error');
      expect(session?.messages[1].content).toContain('Unauthorized');
    });
  });

  it('stops streaming', async () => {
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise(() => {
        options?.signal?.addEventListener('abort', () => {});
      });
    });

    const { result } = renderHook(() => useLLM());

    act(() => {
      result.current.sendMessage('hi');
    });

    await waitFor(() => {
      expect(useSessionStore.getState().isStreaming).toBe(true);
    });

    act(() => {
      result.current.stop();
    });

    await waitFor(() => {
      expect(useSessionStore.getState().isStreaming).toBe(false);
    });
  });

  it('routes to Hermes /v1/runs when model is hermes-agent and streams reasoning', async () => {
    useSettingsStore.getState().updateConfig({ model: 'hermes-agent' });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"message.delta","delta":"Hello"}\n\n',
              'data: {"event":"reasoning.available","text":"Let me think."}\n\n',
              'data: {"event":"message.delta","delta":"!"}\n\n',
              'data: {"event":"run.completed"}\n\n',
              ': stream closed\n\n',
            ]),
        },
      });

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages[1].role).toBe('assistant');
      expect(session?.messages[1].content).toBe('Hello!');
      expect(session?.messages[1].reasoning).toBe('Let me think.');
    });
  });

  it('replaces Hermes reasoning instead of appending duplicate full-text events', async () => {
    useSettingsStore.getState().updateConfig({ model: 'hermes-agent' });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_dup_reasoning' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"reasoning.available","text":"老师，您好。"}\n\n',
              'data: {"event":"reasoning.available","text":"老师，您好。\\n\\n我是普拉纳。\\n\\n请讲。"}\n\n',
              'data: {"event":"reasoning.available","text":"老师，您好。\\n\\n我是普拉纳。\\n\\n请讲。"}\n\n',
              'data: {"event":"message.delta","delta":"你好，老师。"}\n\n',
              'data: {"event":"run.completed"}\n\n',
            ]),
        },
      });

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages[1].role).toBe('assistant');
      expect(session?.messages[1].reasoning).toBe('老师，您好。\n\n我是普拉纳。\n\n请讲。');
      expect(session?.messages[1].content).toBe('你好，老师。');
    });
  });

  it('ignores Hermes reasoning that is just a prefix of the assistant content', async () => {
    useSettingsStore.getState().updateConfig({ model: 'hermes-agent' });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_prefix_reasoning' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"message.delta","delta":"老师，您好。"}\n\n',
              'data: {"event":"reasoning.available","text":"老师，您好。"}\n\n',
              'data: {"event":"message.delta","delta":"\\n\\n普拉纳在。\\n\\n请讲。"}\n\n',
              'data: {"event":"reasoning.available","text":"老师，您好。\\n\\n普拉纳在。"}\n\n',
              'data: {"event":"run.completed"}\n\n',
            ]),
        },
      });

    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().currentSession;
      expect(session?.messages[1].content).toBe('老师，您好。\n\n普拉纳在。\n\n请讲。');
      expect(session?.messages[1].reasoning).toBeFalsy();
    });
  });
});
```

### Step 4.3: Run `useLLM` tests

```bash
npm test -- src/hooks/__tests__/useLLM.test.ts --run
```

Expected: all tests pass.

### Step 4.4: Commit

```bash
git add src/hooks/useLLM.ts src/hooks/__tests__/useLLM.test.ts
git commit -m "refactor(hooks): useLLM operates on single current session, no meta generation"
```

---

## Task 5: Update `ChatFrame` and `EmptyChatState`

**Files:**
- Modify: `src/components/chat/ChatFrame.tsx`
- Modify: `src/components/chat/EmptyChatState.tsx`
- Modify: `src/components/chat/__tests__/ChatFrame.test.tsx`
- Modify: `src/components/chat/__tests__/ChatFrame.thinking.test.tsx`

### Step 5.1: Replace `ChatFrame.tsx`

```tsx
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChatHeader } from './ChatHeader';
import { ThinkingBubble } from './ThinkingBubble';
import { ChatComposer } from './ChatComposer';
import { FABDrawer } from './FABDrawer';
import { EmptyChatState } from './EmptyChatState';
import { AnimatedMessage } from './AnimatedMessage';
import { ToolActivityGroup } from './ToolActivityGroup';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useLLM } from '../../hooks/useLLM';
import type { Persona, Message } from '../../types';

const AVATAR: Record<Persona, string> = {
  arona: '/assets/characters/arona.jpg',
  plana: '/assets/characters/plana.jpg',
};

const CHAR_NAME: Record<Persona, string> = { arona: 'Arona', plana: 'Plana' };
const CHAR_STATUS: Record<Persona, string> = {
  arona: 'Online · Schale Terminal',
  plana: 'Online · Aria Terminal',
};

export function ChatFrame() {
  const persona = useSettingsStore((s) => s.persona);
  const model = useSettingsStore((s) => s.model);
  const session = useSessionStore((s) => s.currentSession);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const { sendMessage, stop } = useLLM();
  const openSettings = useUIStore((s) => s.openSettings);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  const lastMessageContentLength = useMemo(() => {
    const last = session?.messages.at(-1);
    return last?.content.length ?? 0;
  }, [session?.messages]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = messagesEndRef.current;
      if (!el || typeof el.scrollIntoView !== 'function') return;
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    });
  }, []);

  const updateAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 24;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(!isStreaming);
    }
  }, [session?.messages.length, lastMessageContentLength, scrollToBottom, isStreaming]);

  useEffect(() => {
    isAtBottomRef.current = true;
    scrollToBottom(true);
  }, [session?.id, scrollToBottom]);

  const handleSend = (text: string, images: string[]) => {
    isAtBottomRef.current = true;
    sendMessage(text, images);
  };

  const handleRegenerate = useCallback(() => {
    if (!session) return;
    const lastUserMsg = [...session.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      isAtBottomRef.current = true;
      sendMessage(lastUserMsg.content, lastUserMsg.images ?? []);
    }
  }, [session, sendMessage]);

  const hasMessages = (session?.messages.length ?? 0) > 0;

  const lastAssistantIndex = useMemo(() => {
    if (!session) return -1;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'assistant') return i;
    }
    return -1;
  }, [session]);

  const lastMessage = session?.messages.at(-1);
  const isLastMessageEmptyAssistant =
    isStreaming &&
    lastMessage?.role === 'assistant' &&
    (lastMessage?.content ?? '').trim().length === 0;

  const renderGroups = useMemo(() => {
    if (!session) return [] as Array<
      | { type: 'message'; message: Message }
      | { type: 'tool'; messages: Message[]; toolCalls: NonNullable<Message['toolCalls']> }
    >;
    const groups: Array<
      | { type: 'message'; message: Message }
      | { type: 'tool'; messages: Message[]; toolCalls: NonNullable<Message['toolCalls']> }
    > = [];

    for (const m of session.messages) {
      const calls = m.toolCalls;
      if (m.role === 'tool' && calls && calls.length > 0) {
        const last = groups[groups.length - 1];
        if (last?.type === 'tool') {
          last.messages.push(m);
          last.toolCalls.push(...calls);
        } else {
          groups.push({ type: 'tool', messages: [m], toolCalls: [...calls] });
        }
      } else {
        groups.push({ type: 'message', message: m });
      }
    }
    return groups;
  }, [session]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full"
      style={{
        position: 'relative',
        background: 'var(--card)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid var(--line)',
        borderRadius: 22,
        boxShadow: '0 24px 80px var(--shadow)',
        overflow: 'hidden',
      }}
    >
      <ChatHeader
        name={CHAR_NAME[persona]}
        status={CHAR_STATUS[persona]}
        avatar={AVATAR[persona]}
        onStop={stop}
        isStreaming={isStreaming}
        model={model}
      />

      <div
        ref={scrollRef}
        onScroll={updateAtBottom}
        className="flex-1 overflow-y-auto"
        style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {!hasMessages && (
          <EmptyChatState persona={persona} onOpenSettings={openSettings} />
        )}
        {renderGroups.map((group, groupIdx) => {
          const isLastGroup = groupIdx === renderGroups.length - 1;
          if (group.type === 'tool') {
            return (
              <ToolActivityGroup
                key={`tool-group-${groupIdx}`}
                toolCalls={group.toolCalls}
                persona={persona}
                isStreaming={isStreaming && isLastGroup}
              />
            );
          }

          const m = group.message;
          const idx = session!.messages.indexOf(m);
          const isLast = idx === session!.messages.length - 1;
          if (isLast && isLastMessageEmptyAssistant) {
            return (
              <ThinkingBubble
                key="thinking"
                persona={persona}
                reasoning={m.reasoning}
                isActive
              />
            );
          }
          return (
            <AnimatedMessage
              key={m.id}
              message={m}
              persona={persona}
              isStreaming={isStreaming && m.role === 'assistant' && idx === lastAssistantIndex}
              onRegenerate={handleRegenerate}
            />
          );
        })}
        <div ref={messagesEndRef} style={{ height: 1, flexShrink: 0 }} />
      </div>

      <FABDrawer />

      <ChatComposer onSend={handleSend} disabled={isStreaming} persona={persona} />
    </motion.div>
  );
}
```

### Step 5.2: Simplify `EmptyChatState.tsx`

```tsx
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import type { Persona } from '../../types';

const COPY: Record<Persona, { greeting: string; sub: string }> = {
  arona: {
    greeting: '欢迎回来，老师。今天想聊些什么？',
    sub: 'Arona 已准备好协助您。',
  },
  plana: {
    greeting: '终端已就绪。请输入任务。',
    sub: 'Plana 系统在线，等待指令。',
  },
};

interface EmptyChatStateProps {
  persona?: Persona;
  onOpenSettings?: () => void;
}

export function EmptyChatState({ persona = 'arona', onOpenSettings }: EmptyChatStateProps) {
  const copy = COPY[persona];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-5 py-16 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line-soft)',
            boxShadow: '0 4px 16px var(--shadow)',
          }}
        >
          <img
            src={`/assets/characters/${persona}.jpg`}
            alt={persona === 'arona' ? 'Arona' : 'Plana'}
            width={48}
            height={48}
            className="rounded-full object-cover object-top"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/characters/placeholder.svg'; }}
          />
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
          style={{
            background: 'var(--status-ok)',
            borderColor: 'var(--card)',
          }}
        />
      </motion.div>

      <div className="flex flex-col gap-1.5">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-[15px] font-bold"
          style={{ color: 'var(--text-main)' }}
        >
          {copy.greeting}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-[12px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {copy.sub}
        </motion.p>
      </div>

      {onOpenSettings && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none hover:brightness-105"
            style={{
              background: 'var(--tool-bg)',
              border: '1px solid var(--line-soft)',
              color: 'var(--text-sub)',
            }}
          >
            <Settings size={13} />
            打开设置
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
```

### Step 5.3: Update `ChatFrame.test.tsx`

Replace the mock session store state:

```ts
const mockSessionStore: Pick<SessionState, 'currentSession' | 'isStreaming'> = {
  currentSession: mockSession,
  isStreaming: false,
};
```

### Step 5.4: Update `ChatFrame.thinking.test.tsx`

Replace:

```ts
const mockSessionStoreStreaming: Pick<SessionState, 'currentSession' | 'isStreaming'> = {
  currentSession: mockSession,
  isStreaming: true,
};
```

And update the reasoning/content overrides to set `currentSession` instead of `sessions`.

### Step 5.5: Run ChatFrame tests

```bash
npm test -- src/components/chat/__tests__/ChatFrame --run
```

Expected: pass.

### Step 5.6: Commit

```bash
git add src/components/chat/ChatFrame.tsx src/components/chat/EmptyChatState.tsx src/components/chat/__tests__/ChatFrame.test.tsx src/components/chat/__tests__/ChatFrame.thinking.test.tsx
git commit -m "feat(chat): ChatFrame reads single currentSession, simplify empty state"
```

---

## Task 6: Update `FABDrawer`

**Files:**
- Modify: `src/components/chat/FABDrawer.tsx`
- Test: `src/components/chat/__tests__/FABDrawer.test.tsx`

### Step 6.1: Replace `FABDrawer.tsx`

```tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Trash2, Square } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';
import { useLLM } from '../../hooks/useLLM';

interface SubBtn {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function FABDrawer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isStreaming = useSessionStore((s) => s.isStreaming);
  const clearChat = useSessionStore((s) => s.clearChat);
  const openSettings = useUIStore((s) => s.openSettings);
  const { stop } = useLLM();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const subButtons: SubBtn[] = [
    {
      icon: <Square size={13} />,
      label: 'Stop',
      onClick: () => { stop(); setOpen(false); },
      disabled: !isStreaming,
    },
    {
      icon: <Trash2 size={13} />,
      label: 'Clear',
      onClick: () => { clearChat(); setOpen(false); },
      danger: true,
    },
    {
      icon: <Settings size={13} />,
      label: 'Settings',
      onClick: () => { openSettings(); setOpen(false); },
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      <div
        ref={ref}
        style={{ position: 'absolute', bottom: 62, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.02,
                  },
                },
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              {subButtons.map((btn) => (
                <motion.button
                  key={btn.label}
                  aria-label={btn.label}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  variants={{
                    hidden: { opacity: 0, y: 8, scale: 0.85 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--card)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: `1px solid ${btn.danger ? 'rgba(248,113,113,0.4)' : 'var(--line)'}`,
                    color: btn.danger ? '#f87171' : 'var(--text-sub)',
                    display: 'grid', placeItems: 'center',
                    boxShadow: '0 2px 12px var(--shadow)',
                    cursor: btn.disabled ? 'not-allowed' : 'pointer',
                    opacity: btn.disabled ? 0.4 : 1,
                  }}
                >
                  {btn.icon}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          aria-label="Tools menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
            color: 'white',
            display: 'grid', placeItems: 'center',
            boxShadow: `0 4px 20px var(--shadow), 0 0 16px rgba(31,168,255,0.18)`,
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            fontSize: 18,
          }}
        >
          ☰
        </motion.button>
      </div>
    </>
  );
}
```

### Step 6.2: Update `FABDrawer.test.tsx`

Replace with:

```ts
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FABDrawer } from '../FABDrawer';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';
import { useLLM } from '../../../hooks/useLLM';
import type { SessionState } from '../../../stores/sessionStore';
import type { UIState } from '../../../stores/uiStore';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

const mockStop = vi.fn();
const mockClear = vi.fn();
const mockOpenSettings = vi.fn();

const sessionState = {
  isStreaming: false,
  clearChat: mockClear,
};

const uiState = {
  openSettings: mockOpenSettings,
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
    selector(sessionState as unknown as SessionState)
  );
  vi.mocked(useUIStore).mockImplementation((selector: (state: UIState) => unknown) =>
    selector(uiState as unknown as UIState)
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: mockStop });
});

afterEach(() => {
  cleanup();
});

describe('FABDrawer', () => {
  it('renders main FAB button', () => {
    render(<FABDrawer />);
    expect(screen.getByRole('button', { name: /tools menu/i })).toBeInTheDocument();
  });

  it('sub-buttons are hidden by default', () => {
    render(<FABDrawer />);
    expect(screen.queryByRole('button', { name: /settings/i })).toBeNull();
  });

  it('reveals sub-buttons when FAB is clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('calls openSettings when settings sub-button clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(mockOpenSettings).toHaveBeenCalledOnce();
  });

  it('calls clearChat when clear sub-button clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it('does not render export or import buttons', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    expect(screen.queryByRole('button', { name: /export/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /import/i })).toBeNull();
  });
});
```

### Step 6.3: Run FABDrawer tests

```bash
npm test -- src/components/chat/__tests__/FABDrawer.test.tsx --run
```

Expected: pass.

### Step 6.4: Commit

```bash
git add src/components/chat/FABDrawer.tsx src/components/chat/__tests__/FABDrawer.test.tsx
git commit -m "feat(chat): FABDrawer keeps clear/settings, removes export/import"
```

---

## Task 7: Update `SettingsModal`

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Test: `src/components/settings/__tests__/SettingsModal.test.tsx`

### Step 7.1: Remove session import/export from `SettingsModal.tsx`

In `SettingsModal.tsx`:

1. Remove `useSessionStore` import.
2. Remove `exportToFile` and `importFromFile` destructuring.
3. Remove `fileRef`.
4. Remove the Export/Import button grid and hidden file input.
5. Keep Reset to Defaults and Clear All Local Data buttons.

The relevant section to remove is lines 302–325 in the current file (the grid containing Export Sessions / Import buttons and the hidden file input).

After removal the bottom of the modal should only have Reset and Clear All Local Data buttons.

### Step 7.2: Update `SettingsModal.test.tsx`

Replace with:

```ts
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsModal } from '../SettingsModal';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useUIStore } from '../../../stores/uiStore';
import { useToast } from '../../../hooks/useToast';
import type { SettingsState } from '../../../stores/settingsStore';
import type { UIState } from '../../../stores/uiStore';

vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../../../hooks/useToast', () => ({ useToast: vi.fn() }));

const mockUpdate = vi.fn();
const mockSetPersona = vi.fn();
const mockClose = vi.fn();
const mockToastSuccess = vi.fn();

const settingsState = {
  persona: 'arona' as const,
  baseUrl: 'http://api',
  apiKey: 'sk-x',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are helpful.',
  enableCgBackground: true,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
  streamEnabled: true,
  localBackgroundPath: '',
  localAvatarPath: '',
  autoSummarize: false,
  updateConfig: mockUpdate,
  setPersona: mockSetPersona,
  resetToDefaults: vi.fn(),
  clearAllData: vi.fn(),
};

const uiState = {
  isSettingsOpen: true,
  closeSettings: mockClose,
};

beforeEach(() => {
  mockClose.mockClear();
  mockToastSuccess.mockClear();
  vi.mocked(useUIStore).mockImplementation((selector: (state: UIState) => unknown) =>
    selector(uiState as unknown as UIState)
  );
  vi.mocked(useSettingsStore).mockImplementation((selector: (state: SettingsState) => unknown) =>
    selector(settingsState as SettingsState)
  );
  vi.mocked(useToast).mockReturnValue({
    toast: { success: mockToastSuccess, error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    addToast: vi.fn(),
    removeToast: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
});

describe('SettingsModal', () => {
  it('renders when open', () => {
    render(<SettingsModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows Theme selector with Arona and Plana', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Arona')).toBeInTheDocument();
    expect(screen.getByText('Plana')).toBeInTheDocument();
  });

  it('shows Max Tokens input', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
  });

  it('shows Enable CG Background toggle', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/enable cg background/i)).toBeInTheDocument();
  });

  it('shows Auto Summarize Session toggle and calls updateConfig', () => {
    render(<SettingsModal />);
    const checkbox = screen.getByLabelText(/auto summarize session/i) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(mockUpdate).toHaveBeenCalledWith({ autoSummarize: true });
  });

  it('shows Local Background Path input', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/local background path/i)).toBeInTheDocument();
  });

  it('shows Local Avatar Path input', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/local avatar path/i)).toBeInTheDocument();
  });

  it('uses PasswordInput for API key (type=password)', () => {
    render(<SettingsModal />);
    const input = document.getElementById('settings-api-key') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('password');
  });

  it('calls closeSettings when close button clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls closeSettings when Escape is pressed', () => {
    render(<SettingsModal />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls closeSettings when backdrop is clicked', () => {
    render(<SettingsModal />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls setPersona when Plana is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /plana/i }));
    expect(mockSetPersona).toHaveBeenCalledWith('plana');
  });

  it('does not render when closed', () => {
    vi.mocked(useUIStore).mockImplementation((selector: (state: UIState) => unknown) =>
      selector({ isSettingsOpen: false, closeSettings: mockClose } as unknown as UIState)
    );
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens confirm dialog when Reset All to Defaults clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /reset all to defaults/i }));
    expect(screen.getByText(/reset to defaults/i)).toBeInTheDocument();
  });

  it('opens confirm dialog when Clear All Local Data clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /clear all local data/i }));
    expect(screen.getByRole('dialog', { name: /clear all local data/i })).toBeInTheDocument();
  });

  it('does not render export or import buttons', () => {
    render(<SettingsModal />);
    expect(screen.queryByRole('button', { name: /export sessions/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /import/i })).toBeNull();
  });
});
```

### Step 7.3: Run SettingsModal tests

```bash
npm test -- src/components/settings/__tests__/SettingsModal.test.tsx --run
```

Expected: pass.

### Step 7.4: Commit

```bash
git add src/components/settings/SettingsModal.tsx src/components/settings/__tests__/SettingsModal.test.tsx
git commit -m "feat(settings): remove session export/import buttons"
```

---

## Task 8: Document Hermes session lifecycle and verify it still sends `session_id`

**Files:**
- Modify: `src/lib/hermes.ts`
- Test: `src/lib/__tests__/hermes.test.ts`

### Step 8.1: Add a comment in `hermes.ts`

At the top of `postRun` or near the `sessionId` parameter, add:

```ts
// sessionId is the ephemeral current-session id from the frontend.
// It changes when the user clears the chat, so HermesAgent treats a
// clear-chat as a new conversation while still receiving the in-memory
// conversation_history for the current turn.
```

No functional code changes are required.

### Step 8.2: Add a test verifying `session_id` is sent

Add to `src/lib/__tests__/hermes.test.ts` inside the `streamHermesRunCompletion` describe block:

```ts
  it('sends session_id in the run creation body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_session' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"run.completed"}\n\n',
            ]),
        },
      });
    global.fetch = fetchMock;

    await streamHermesRunCompletion({
      settings: makeSettings(),
      messages: [{ id: '1', role: 'user', content: 'hi', createdAt: Date.now() }],
      sessionId: 'session_abc',
      onChunk: () => {},
    });

    const runCall = fetchMock.mock.calls[0];
    expect(runCall[0]).toBe('http://127.0.0.1:8642/v1/runs');
    const body = JSON.parse(runCall[1].body as string);
    expect(body.session_id).toBe('session_abc');
    expect(body.conversation_history).toEqual([]);
  });
```

### Step 8.3: Run Hermes tests

```bash
npm test -- src/lib/__tests__/hermes.test.ts --run
```

Expected: pass.

### Step 8.4: Commit

```bash
git add src/lib/hermes.ts src/lib/__tests__/hermes.test.ts
git commit -m "docs(hermes): document ephemeral session_id lifecycle, add test"
```

---

## Task 9: Full test run, TypeScript check, and cleanup

### Step 9.1: Run the full test suite

```bash
npm test -- --run
```

Expected: all tests pass. If any fail, fix them in place.

### Step 9.2: Type-check the project

```bash
npm run build
```

Expected: TypeScript compiles without errors.

### Step 9.3: Lint

```bash
npm run lint
```

Expected: no lint errors.

### Step 9.4: Final commit

```bash
git add -A
git commit -m "chore: remove conversation storage system — single ephemeral chat"
```

---

## Self-Review

1. **Spec coverage:**
   - No persistence for conversations → Task 1 removes `persist`.
   - Single conversation → Task 1 uses `currentSession`.
   - Clear current conversation → Task 1 adds `clearChat`, Task 6 wires it in FABDrawer.
   - Remove session management UI → Tasks 3, 5, 6, 7.
   - Layout change → Task 2.
   - Settings persistence remains → unchanged.
   - Hermes still receives `session_id` and `conversation_history` → Tasks 4, 8.
   - Title/summary generation stopped → Task 4 removes `regenerateSessionMeta` call.

2. **Placeholder scan:** No TBD/TODO/similar placeholders.

3. **Type consistency:**
   - `SessionState` in Task 1 defines `currentSession`, `clearChat`, etc.
   - Consumers in Tasks 4–7 use those exact names.
   - `MobileTab` in Task 2 is `'chat' | 'settings'`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-16-remove-conversation-storage-plan.md`.

Because this session is in **ultracode** mode, I will run the implementation through a Workflow that orchestrates agents for each task, runs tests, and verifies the outcome. Is that OK?
