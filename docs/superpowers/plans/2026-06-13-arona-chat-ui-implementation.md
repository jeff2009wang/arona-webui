# Arona Chat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Blue-Archive-inspired Web LLM chat UI with Arona/Plana dual themes, history list, chat phone frame, tool call visualization, settings modal, and OpenAI-compatible streaming.

**Architecture:** React + TypeScript + Vite + Tailwind CSS. State split into independent Zustand stores per domain (settings, sessions, UI). CSS variables drive the dual theme system. LLM calls use native `fetch` with SSE streaming. Persistence via Zustand persist to localStorage, with an adapter pattern for future IndexedDB migration.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Vitest, @testing-library/react

---

## File Structure

```
arona-webui/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts
│   ├── stores/
│   │   ├── settingsStore.ts
│   │   ├── sessionStore.ts
│   │   ├── uiStore.ts
│   │   └── __tests__/
│   │       ├── settingsStore.test.ts
│   │       ├── sessionStore.test.ts
│   │       └── uiStore.test.ts
│   ├── lib/
│   │   ├── storage.ts
│   │   ├── llm.ts
│   │   └── __tests__/
│   │       ├── storage.test.ts
│   │       └── llm.test.ts
│   ├── hooks/
│   │   ├── useLLM.ts
│   │   └── __tests__/
│   │       └── useLLM.test.ts
│   └── components/
│       ├── layout/
│       │   ├── TopStatusBar.tsx
│       │   ├── DesktopLayout.tsx
│       │   └── MobileLayout.tsx
│       ├── chat/
│       │   ├── ChatPhoneFrame.tsx
│       │   ├── ChatHeader.tsx
│       │   ├── AssistantBubble.tsx
│       │   ├── UserBubble.tsx
│       │   ├── ToolCard.tsx
│       │   ├── TypingIndicator.tsx
│       │   └── ChatComposer.tsx
│       ├── panels/
│       │   ├── HistoryPanel.tsx
│       │   └── ActionsPanel.tsx
│       └── settings/
│           └── SettingsModal.tsx
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── vitest.config.ts
```

---

## Task 1: Initialize Vite + TypeScript + Tailwind Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Test: `vitest.config.ts`

- [ ] **Step 1: Create Vite React TS project**

Run:
```bash
cd /root/arona-webui
npm create vite@latest . -- --template react-ts
```

Expected: Project scaffolded with `src/`, `index.html`, `package.json`, etc.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install zustand lucide-react
npm install -D tailwindcss postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Modify: `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 8px 32px rgba(53,156,215,0.10)',
        'soft-strong': '0 8px 32px rgba(53,156,215,0.16)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Configure base CSS**

Modify: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', 'Noto Sans SC', sans-serif;
  }
  body {
    margin: 0;
    min-height: 100vh;
  }
}
```

- [ ] **Step 5: Update index.html fonts**

Modify: `index.html`

Add inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Configure Vitest**

Create: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Add test script**

Modify: `package.json`

Add to `scripts`:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 8: Verify dev server starts**

Run:
```bash
npm run dev
```

Expected: Vite dev server starts, no errors. Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: initialize vite react ts + tailwind + vitest"
```

---

## Task 2: Define Core Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types file**

Create: `src/types/index.ts`

```typescript
export type Persona = 'arona' | 'plana';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'running' | 'success' | 'error';
  startedAt: number;
  finishedAt?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: number;
  toolCalls?: ToolCall[];
  status?: 'sending' | 'sent' | 'error';
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
}

export interface Settings {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  persona: Persona;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add core type definitions"
```

---

## Task 3: Storage Adapter + Persistence

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/__tests__/storage.test.ts`

- [ ] **Step 1: Write the storage adapter**

Create: `src/lib/storage.ts`

```typescript
import type { StateStorage } from 'zustand/middleware';

export const localStorageAdapter: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};
```

- [ ] **Step 2: Write failing test**

Create: `src/lib/__tests__/storage.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageAdapter } from '../storage';

describe('localStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves items', () => {
    localStorageAdapter.setItem('test-key', '{"value":1}');
    expect(localStorageAdapter.getItem('test-key')).toBe('{"value":1}');
  });

  it('returns null for missing keys', () => {
    expect(localStorageAdapter.getItem('missing')).toBeNull();
  });

  it('removes items', () => {
    localStorageAdapter.setItem('remove-key', 'x');
    localStorageAdapter.removeItem('remove-key');
    expect(localStorageAdapter.getItem('remove-key')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- src/lib/__tests__/storage.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage.ts src/lib/__tests__/storage.test.ts
git commit -m "feat: add localStorage adapter for zustand persist"
```

---

## Task 4: Settings Store

**Files:**
- Create: `src/stores/settingsStore.ts`, `src/stores/__tests__/settingsStore.test.ts`

- [ ] **Step 1: Write settings store**

Create: `src/stores/settingsStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { localStorageAdapter } from '../lib/storage';

export interface SettingsState extends Settings {
  updateConfig: (config: Partial<Settings>) => void;
  setPersona: (persona: Settings['persona']) => void;
  resetToDefaults: () => void;
}

const defaultSettings: Settings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  systemPrompt: '你是一个 helpful 的 AI 助手。',
  persona: 'arona',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateConfig: (config) => set((state) => ({ ...state, ...config })),
      setPersona: (persona) => set({ persona }),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'arona-settings',
      storage: localStorageAdapter,
    }
  )
);
```

- [ ] **Step 2: Write failing test**

Create: `src/stores/__tests__/settingsStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getState().resetToDefaults());
  });

  it('has default values', () => {
    const state = useSettingsStore.getState();
    expect(state.baseUrl).toBe('https://api.openai.com/v1');
    expect(state.persona).toBe('arona');
  });

  it('updates config', () => {
    useSettingsStore.getState().updateConfig({ temperature: 0.5 });
    expect(useSettingsStore.getState().temperature).toBe(0.5);
  });

  it('changes persona', () => {
    useSettingsStore.getState().setPersona('plana');
    expect(useSettingsStore.getState().persona).toBe('plana');
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- src/stores/__tests__/settingsStore.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/settingsStore.ts src/stores/__tests__/settingsStore.test.ts
git commit -m "feat: add settings store with persistence"
```

---

## Task 5: Session Store

**Files:**
- Create: `src/stores/sessionStore.ts`, `src/stores/__tests__/sessionStore.test.ts`

- [ ] **Step 1: Write session store**

Create: `src/stores/sessionStore.ts`

```typescript
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

const generateId = () => Math.random().toString(36).slice(2, 11);

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
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId:
            state.currentSessionId === id
              ? state.sessions.find((s) => s.id !== id)?.id ?? null
              : state.currentSessionId,
        })),

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
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.sessions)) {
          set({ sessions: parsed.sessions, currentSessionId: parsed.sessions[0]?.id ?? null });
        }
      },

      setStreaming: (value) => set({ isStreaming: value }),
    }),
    {
      name: 'arona-sessions',
      storage: localStorageAdapter,
    }
  )
);
```

- [ ] **Step 2: Write failing test**

Create: `src/stores/__tests__/sessionStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });
  });

  it('creates a session and selects it', () => {
    const id = useSessionStore.getState().createSession();
    expect(useSessionStore.getState().currentSessionId).toBe(id);
    expect(useSessionStore.getState().sessions).toHaveLength(1);
  });

  it('renames a session', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().renameSession(id, 'Test Chat');
    expect(useSessionStore.getState().sessions[0].title).toBe('Test Chat');
  });

  it('adds a message', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    expect(useSessionStore.getState().sessions[0].messages).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- src/stores/__tests__/sessionStore.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/sessionStore.ts src/stores/__tests__/sessionStore.test.ts
git commit -m "feat: add session store with CRUD and import/export"
```

---

## Task 6: UI Store

**Files:**
- Create: `src/stores/uiStore.ts`, `src/stores/__tests__/uiStore.test.ts`

- [ ] **Step 1: Write UI store**

Create: `src/stores/uiStore.ts`

```typescript
import { create } from 'zustand';

type MobileTab = 'chat' | 'history' | 'tools' | 'settings';

export interface UIState {
  isHistoryOpen: boolean;
  isActionsOpen: boolean;
  activeMobileTab: MobileTab;
  isSettingsOpen: boolean;
  toggleHistory: () => void;
  toggleActions: () => void;
  setActiveMobileTab: (tab: MobileTab) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isHistoryOpen: true,
  isActionsOpen: true,
  activeMobileTab: 'chat',
  isSettingsOpen: false,
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
  toggleActions: () => set((state) => ({ isActionsOpen: !state.isActionsOpen })),
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));
```

- [ ] **Step 2: Write failing test**

Create: `src/stores/__tests__/uiStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      isHistoryOpen: true,
      isActionsOpen: true,
      activeMobileTab: 'chat',
      isSettingsOpen: false,
    });
  });

  it('toggles history panel', () => {
    useUIStore.getState().toggleHistory();
    expect(useUIStore.getState().isHistoryOpen).toBe(false);
  });

  it('opens and closes settings', () => {
    useUIStore.getState().openSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(true);
    useUIStore.getState().closeSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- src/stores/__tests__/uiStore.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/stores/uiStore.ts src/stores/__tests__/uiStore.test.ts
git commit -m "feat: add ui store for layout state"
```

---

## Task 7: Theme System

**Files:**
- Create: `src/components/layout/ThemeProvider.tsx`
- Modify: `src/index.css`, `src/App.tsx`

- [ ] **Step 1: Add CSS theme variables**

Modify: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-page: #F4FBFF;
    --bg-page-end: #EAF7FF;
    --bg-card: rgba(255, 255, 255, 0.92);
    --border: rgba(189, 238, 255, 0.7);
    --border-strong: #BDEEFF;
    --primary: #35B8FF;
    --primary-light: #4CCBFF;
    --accent: #FF8BA7;
    --text-main: #1E2D3D;
    --text-secondary: #6B8A9E;
    --text-muted: #9AB8CC;
    --shadow: rgba(53, 156, 215, 0.10);
    --shadow-strong: rgba(53, 156, 215, 0.16);
    --bubble-user-start: #4CCBFF;
    --bubble-user-end: #35B8FF;
    --bubble-assistant: #FFFFFF;
    --tool-bg: #F4FBFF;
    --hud: rgba(53, 184, 255, 0.12);
  }

  [data-theme='plana'] {
    --bg-page: #0F1724;
    --bg-page-end: #131D2F;
    --bg-card: rgba(27, 38, 56, 0.85);
    --border: rgba(105, 183, 255, 0.22);
    --border-strong: rgba(105, 183, 255, 0.35);
    --primary: #69B7FF;
    --primary-light: #8DA8FF;
    --accent: #A78BFA;
    --text-main: #E8F1FA;
    --text-secondary: #9FB8D4;
    --text-muted: #6B85A3;
    --shadow: rgba(0, 0, 0, 0.25);
    --shadow-strong: rgba(0, 0, 0, 0.35);
    --bubble-user-start: #69B7FF;
    --bubble-user-end: #5A9CE8;
    --bubble-assistant: #1B2638;
    --tool-bg: #131D2F;
    --hud: rgba(105, 183, 255, 0.08);
  }

  html {
    font-family: 'Inter', 'Noto Sans SC', sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: linear-gradient(165deg, var(--bg-page) 0%, var(--bg-page-end) 100%);
    color: var(--text-main);
  }
}
```

- [ ] **Step 2: Create ThemeProvider**

Create: `src/components/layout/ThemeProvider.tsx`

```typescript
import { useEffect, type ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const persona = useSettingsStore((state) => state.persona);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', persona);
  }, [persona]);

  return <>{children}</>;
}
```

- [ ] **Step 3: Wrap App with ThemeProvider**

Modify: `src/App.tsx`

```typescript
import { ThemeProvider } from './components/layout/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">Arona Chat</div>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 4: Verify theme switch works**

Run dev server, open browser, manually change `persona` in localStorage or via React DevTools. Expected: background color changes.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/layout/ThemeProvider.tsx src/App.tsx
git commit -m "feat: add Arona/Plana CSS theme system"
```

---

## Task 8: LLM Client

**Files:**
- Create: `src/lib/llm.ts`, `src/lib/__tests__/llm.test.ts`

- [ ] **Step 1: Write LLM client**

Create: `src/lib/llm.ts`

```typescript
import type { Message, Settings } from '../types';

export interface LLMOptions {
  settings: Settings;
  messages: Message[];
  onChunk: (chunk: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; arguments: string }) => void;
  signal?: AbortSignal;
}

export class LLMError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'LLMError';
  }
}

export async function streamChatCompletion({
  settings,
  messages,
  onChunk,
  onToolCall,
  signal,
}: LLMOptions): Promise<void> {
  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      stream: true,
      messages: [
        { role: 'system', content: settings.systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.toolCalls,
        })),
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new LLMError(text || `HTTP ${response.status}`, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new LLMError('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) onChunk(delta.content);
        if (delta?.tool_calls && onToolCall) {
          const tc = delta.tool_calls[0];
          onToolCall({ id: tc.id, name: tc.function?.name, arguments: tc.function?.arguments });
        }
      } catch {
        // Ignore malformed lines
      }
    }
  }
}
```

- [ ] **Step 2: Write failing test with mock**

Create: `src/lib/__tests__/llm.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { streamChatCompletion, LLMError } from '../llm';

describe('streamChatCompletion', () => {
  it('streams chunks', async () => {
    const chunks: string[] = [];
    const encoder = new TextEncoder();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => {
          const data = [
            'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
            'data: [DONE]\n\n',
          ];
          let i = 0;
          return {
            read: () => {
              if (i >= data.length) return Promise.resolve({ done: true, value: undefined });
              return Promise.resolve({ done: false, value: encoder.encode(data[i++]) });
            },
          };
        },
      },
    });

    await streamChatCompletion({
      settings: {
        baseUrl: 'http://test',
        apiKey: 'key',
        model: 'gpt-4',
        temperature: 0.7,
        systemPrompt: '',
        persona: 'arona',
      },
      messages: [{ id: '1', role: 'user', content: 'hi', createdAt: Date.now() }],
      onChunk: (c) => chunks.push(c),
    });

    expect(chunks.join('')).toBe('Hello!');
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(
      streamChatCompletion({
        settings: {
          baseUrl: 'http://test',
          apiKey: '',
          model: 'gpt-4',
          temperature: 0.7,
          systemPrompt: '',
          persona: 'arona',
        },
        messages: [],
        onChunk: () => {},
      })
    ).rejects.toThrow(LLMError);
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- src/lib/__tests__/llm.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/llm.ts src/lib/__tests__/llm.test.ts
git commit -m "feat: add OpenAI-compatible streaming LLM client"
```

---

## Task 9: useLLM Hook

**Files:**
- Create: `src/hooks/useLLM.ts`, `src/hooks/__tests__/useLLM.test.ts`

- [ ] **Step 1: Write useLLM hook**

Create: `src/hooks/useLLM.ts`

```typescript
import { useCallback, useRef } from 'react';
import { streamChatCompletion, LLMError } from '../lib/llm';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import type { Message } from '../types';

export function useLLM() {
  const settings = useSettingsStore();
  const { addMessage, updateMessage, setStreaming } = useSessionStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (sessionId: string, content: string) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: Date.now(),
      };

      addMessage(sessionId, userMessage);

      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      addMessage(sessionId, assistantMessage);
      setStreaming(true);

      abortControllerRef.current = new AbortController();

      try {
        await streamChatCompletion({
          settings,
          messages: session.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
          onChunk: (chunk) => {
            updateMessage(sessionId, assistantMessage.id, {
              content: assistantMessage.content + chunk,
            });
            assistantMessage.content += chunk;
          },
          signal: abortControllerRef.current.signal,
        });
      } catch (error) {
        updateMessage(sessionId, assistantMessage.id, {
          content: error instanceof LLMError ? error.message : 'Unknown error',
          status: 'error',
        });
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [settings, addMessage, updateMessage, setStreaming]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, stop };
}
```

- [ ] **Step 2: Write hook test**

Create: `src/hooks/__tests__/useLLM.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLLM } from '../useLLM';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';

describe('useLLM', () => {
  beforeEach(() => {
    useSessionStore.setState({ sessions: [], currentSessionId: null, isStreaming: false });
    useSettingsStore.setState(useSettingsStore.getState().resetToDefaults());
  });

  it('sends a message and adds assistant placeholder', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () => Promise.resolve({ done: true, value: undefined }),
        }),
      },
    });

    const sessionId = useSessionStore.getState().createSession();
    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage(sessionId, 'hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
      expect(session?.messages).toHaveLength(2);
      expect(session?.messages[0].role).toBe('user');
      expect(session?.messages[1].role).toBe('assistant');
    });
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- src/hooks/__tests__/useLLM.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLLM.ts src/hooks/__tests__/useLLM.test.ts
git commit -m "feat: add useLLM hook for sending messages"
```

---

## Task 10: Layout Components

**Files:**
- Create: `src/components/layout/TopStatusBar.tsx`, `src/components/layout/DesktopLayout.tsx`, `src/components/layout/MobileLayout.tsx`

- [ ] **Step 1: Write TopStatusBar**

Create: `src/components/layout/TopStatusBar.tsx`

```typescript
import { Settings } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export function TopStatusBar() {
  const { persona, setPersona } = useSettingsStore();
  const { openSettings } = useUIStore();

  return (
    <header className="sticky top-0 z-10 h-[50px] flex items-center justify-between px-5 border-b border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-md shadow-soft">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] grid place-items-center text-white text-xs font-bold shadow-soft-strong">
          {persona === 'arona' ? 'A' : 'P'}
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--text-main)] tracking-wide">
            {persona === 'arona' ? 'ARONA CHAT' : 'PLANA CHAT'}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] font-semibold tracking-wider">
            {persona === 'arona' ? 'SCHALE TERMINAL' : 'ARIA TERMINAL'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] shadow-soft">
          <button
            onClick={() => setPersona('arona')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              persona === 'arona'
                ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white shadow-soft-strong'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Arona
          </button>
          <button
            onClick={() => setPersona('plana')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              persona === 'plana'
                ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white shadow-soft-strong'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Plana
          </button>
        </div>
        <button
          onClick={openSettings}
          className="w-[30px] h-[30px] rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--primary)] shadow-soft hover:border-[var(--primary)] transition-colors"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Write DesktopLayout**

Create: `src/components/layout/DesktopLayout.tsx`

```typescript
import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';

export function DesktopLayout({
  history,
  chat,
  actions,
}: {
  history: ReactNode;
  chat: ReactNode;
  actions: ReactNode;
}) {
  const { isHistoryOpen, isActionsOpen } = useUIStore();

  return (
    <div className="hidden lg:grid lg:grid-cols-[230px_1fr_200px] gap-3 p-3 h-[calc(100vh-50px)] max-w-[1280px] mx-auto">
      {isHistoryOpen && (
        <div className="h-full overflow-hidden">{history}</div>
      )}
      <div className="h-full overflow-hidden">{chat}</div>
      {isActionsOpen && (
        <div className="h-full overflow-hidden">{actions}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write MobileLayout**

Create: `src/components/layout/MobileLayout.tsx`

```typescript
import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { MessageSquare, Clock, Wrench, Settings } from 'lucide-react';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'history' as const, label: 'History', icon: Clock },
  { id: 'tools' as const, label: 'Tools', icon: Wrench },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

export function MobileLayout({
  chat,
  history,
  tools,
  settings,
}: {
  chat: ReactNode;
  history: ReactNode;
  tools: ReactNode;
  settings: ReactNode;
}) {
  const { activeMobileTab, setActiveMobileTab } = useUIStore();

  const content = {
    chat,
    history,
    tools,
    settings,
  };

  return (
    <div className="lg:hidden flex flex-col h-[calc(100vh-50px)]">
      <div className="flex-1 overflow-hidden p-3">{content[activeMobileTab]}</div>
      <nav className="flex justify-around items-center py-2 pb-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMobileTab(tab.id)}
            className={`flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors ${
              activeMobileTab === tab.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg grid place-items-center ${
                activeMobileTab === tab.id
                  ? 'bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white'
                  : 'bg-[var(--tool-bg)] border border-[var(--border)]'
              }`}
            >
              <tab.icon size={12} />
            </div>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add layout components (topbar, desktop, mobile)"
```

---

## Task 11: Chat Sub-Components Part 1

**Files:**
- Create: `src/components/chat/ChatHeader.tsx`, `src/components/chat/AssistantBubble.tsx`, `src/components/chat/UserBubble.tsx`, `src/components/chat/TypingIndicator.tsx`

- [ ] **Step 1: Write ChatHeader**

Create: `src/components/chat/ChatHeader.tsx`

```typescript
import { RefreshCw, Square, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  status: string;
  avatar: string;
  onRegenerate?: () => void;
  onStop?: () => void;
}

export function ChatHeader({ name, status, avatar, onRegenerate, onStop }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-3 mt-2 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] grid place-items-center text-lg border-2 border-[var(--bg-card)] shadow-soft-strong">
          {avatar}
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--text-main)]">{name}</div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-semibold">
            <span className="w-[5px] h-[5px] rounded-full bg-green-400" />
            {status}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onRegenerate}
          className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors shadow-soft"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={onStop}
          className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors shadow-soft"
        >
          <Square size={12} />
        </button>
        <button className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors shadow-soft">
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write AssistantBubble**

Create: `src/components/chat/AssistantBubble.tsx`

```typescript
import type { Message } from '../../types';

export function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-[10px] bg-[var(--tool-bg)] border border-[var(--border)] grid place-items-center text-xs shrink-0">
        🎓
      </div>
      <div className="max-w-[70%] px-4 py-3 rounded-[20px] rounded-tl-[5px] bg-[var(--bubble-assistant)] border border-[var(--border)] text-xs text-[var(--text-main)] leading-relaxed shadow-soft">
        {message.content}
        <div className="text-[8px] mt-1 opacity-65 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write UserBubble**

Create: `src/components/chat/UserBubble.tsx`

```typescript
import type { Message } from '../../types';

export function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end gap-2 flex-row-reverse">
      <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] grid place-items-center text-xs text-white shrink-0">
        👤
      </div>
      <div className="max-w-[70%] px-4 py-3 rounded-[20px] rounded-tr-[5px] bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-xs text-white leading-relaxed shadow-soft-strong">
        {message.content}
        <div className="text-[8px] mt-1 opacity-75 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write TypingIndicator**

Create: `src/components/chat/TypingIndicator.tsx`

```typescript
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-[10px] bg-[var(--tool-bg)] border border-[var(--border)] grid place-items-center text-xs shrink-0">
        🎓
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-[18px] rounded-tl-[5px] bg-[var(--bubble-assistant)] border border-[var(--border)] shadow-soft">
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '200ms' }} />
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatHeader.tsx src/components/chat/AssistantBubble.tsx src/components/chat/UserBubble.tsx src/components/chat/TypingIndicator.tsx
git commit -m "feat: add chat header and bubble components"
```

---

## Task 12: Chat Sub-Components Part 2

**Files:**
- Create: `src/components/chat/ToolCard.tsx`, `src/components/chat/ChatComposer.tsx`, `src/components/chat/ChatPhoneFrame.tsx`

- [ ] **Step 1: Write ToolCard**

Create: `src/components/chat/ToolCard.tsx`

```typescript
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ToolCall } from '../../types';

interface ToolCardProps {
  toolCall: ToolCall;
}

export function ToolCard({ toolCall }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isRunning = toolCall.status === 'running';
  const statusColor =
    toolCall.status === 'success' ? 'text-green-400' : toolCall.status === 'error' ? 'text-red-400' : 'text-[var(--primary)]';

  return (
    <div className="max-w-[76%] bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
          <span>🔧</span>
          <span>Tool Call · {toolCall.name}</span>
        </div>
        <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] ${statusColor}`}>
          {isRunning && <span className="w-1 h-1 rounded-full bg-[var(--primary)] animate-pulse" />}
          {toolCall.status}
        </div>
      </div>

      <div className="text-[10px] text-[var(--text-secondary)] px-2 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl font-mono">
        {expanded ? JSON.stringify(toolCall.arguments, null, 2) : toolCall.result ? String(toolCall.result).slice(0, 60) : 'Running...'}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Collapse' : 'Details'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write ChatComposer**

Create: `src/components/chat/ChatComposer.tsx`

```typescript
import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  onSend: (value: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[var(--border)] bg-[var(--bg-card)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="输入消息..."
        rows={1}
        disabled={disabled}
        className="flex-1 min-h-[40px] max-h-[120px] px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-xs outline-none resize-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)] transition-all disabled:opacity-60"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white grid place-items-center shadow-soft-strong disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write ChatPhoneFrame**

Create: `src/components/chat/ChatPhoneFrame.tsx`

```typescript
import { ChatHeader } from './ChatHeader';
import { AssistantBubble } from './AssistantBubble';
import { UserBubble } from './UserBubble';
import { ToolCard } from './ToolCard';
import { TypingIndicator } from './TypingIndicator';
import { ChatComposer } from './ChatComposer';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLLM } from '../../hooks/useLLM';
import type { Message } from '../../types';

function renderMessage(message: Message) {
  if (message.role === 'user') return <UserBubble key={message.id} message={message} />;
  if (message.role === 'assistant') return <AssistantBubble key={message.id} message={message} />;
  if (message.role === 'tool' && message.toolCalls) {
    return message.toolCalls.map((tc) => <ToolCard key={tc.id} toolCall={tc} />);
  }
  return null;
}

export function ChatPhoneFrame() {
  const persona = useSettingsStore((state) => state.persona);
  const { currentSessionId, sessions, isStreaming } = useSessionStore();
  const { sendMessage, stop } = useLLM();

  const session = sessions.find((s) => s.id === currentSessionId);

  const handleSend = (content: string) => {
    if (currentSessionId) sendMessage(currentSessionId, content);
  };

  return (
    <div className="relative flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] shadow-soft overflow-hidden">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-[18px] bg-[var(--tool-bg)] border border-[var(--border)] rounded-b-[11px] border-t-0 z-10" />
      <ChatHeader
        name={persona === 'arona' ? 'Arona' : 'Plana'}
        status={persona === 'arona' ? 'Online · Schale Terminal' : 'Online · Aria Terminal'}
        avatar={persona === 'arona' ? '🎓' : '🌙'}
        onStop={stop}
      />
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
        {session?.messages.map((message) => renderMessage(message))}
        {isStreaming && <TypingIndicator />}
      </div>
      <ChatComposer onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/ToolCard.tsx src/components/chat/ChatComposer.tsx src/components/chat/ChatPhoneFrame.tsx
git commit -m "feat: add tool card, composer, and chat phone frame"
```

---

## Task 13: Side Panels

**Files:**
- Create: `src/components/panels/HistoryPanel.tsx`, `src/components/panels/ActionsPanel.tsx`

- [ ] **Step 1: Write HistoryPanel**

Create: `src/components/panels/HistoryPanel.tsx`

```typescript
import { Plus } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';

export function HistoryPanel() {
  const { sessions, currentSessionId, createSession, selectSession } = useSessionStore();

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[26px] shadow-soft overflow-hidden">
      <div className="p-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[var(--text-main)]">History</span>
          <span className="text-[9px] text-[var(--text-muted)] font-semibold bg-[var(--tool-bg)] px-2 py-0.5 rounded-full">
            {sessions.length} chats
          </span>
        </div>
        <button
          onClick={createSession}
          className="w-full py-2 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--primary)] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[var(--tool-bg)] transition-colors"
        >
          <Plus size={12} />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => selectSession(session.id)}
            className={`flex items-center gap-2 p-2.5 rounded-2xl text-left border transition-all ${
              currentSessionId === session.id
                ? 'bg-[var(--tool-bg)] border-[var(--primary)] shadow-soft'
                : 'border-transparent hover:bg-[var(--tool-bg)]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] grid place-items-center text-sm shrink-0 shadow-soft">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-[var(--text-main)] truncate">{session.title}</div>
              <div className="text-[9px] text-[var(--text-secondary)] truncate">
                {session.messages.at(-1)?.content.slice(0, 30) || 'No messages'}
              </div>
            </div>
            <div className="text-[8px] text-[var(--text-muted)] font-medium">
              {new Date(session.updatedAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write ActionsPanel**

Create: `src/components/panels/ActionsPanel.tsx`

```typescript
import { RefreshCw, Square, Upload, Trash2, FileText } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';

export function ActionsPanel() {
  const { sessions, currentSessionId, isStreaming, clearSession, setStreaming } = useSessionStore();
  const { openSettings } = useUIStore();

  const session = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[26px] shadow-soft overflow-hidden">
      <div className="p-4 pb-3 border-b border-[var(--border)]">
        <span className="text-xs font-bold text-[var(--text-main)]">Actions</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3">
        {session && (
          <div className="bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3">
            <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Current Chat</div>
            <div className="text-xs font-bold text-[var(--text-main)] truncate">{session.title}</div>
            <div className="text-[9px] text-[var(--text-secondary)] mt-1">
              {session.messages.length} messages
            </div>
          </div>
        )}

        <div className="bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3">
          <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Quick Actions</div>
          <div className="flex flex-col gap-1.5">
            <button className="w-full py-2 rounded-xl bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white text-[10px] font-semibold flex items-center justify-center gap-1 shadow-soft-strong">
              <RefreshCw size={11} /> Regenerate
            </button>
            <button
              onClick={() => setStreaming(false)}
              disabled={!isStreaming}
              className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              <Square size={10} /> Stop
            </button>
            <button className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
              <Upload size={11} /> Export
            </button>
            <button
              onClick={() => currentSessionId && clearSession(currentSessionId)}
              className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 hover:border-red-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>

        <div className="bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3">
          <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Terminal</div>
          <button
            onClick={openSettings}
            className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            <FileText size={11} /> Settings
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/panels/
git commit -m "feat: add history and actions panels"
```

---

## Task 14: Settings Modal + Import/Export

**Files:**
- Create: `src/components/settings/SettingsModal.tsx`
- Modify: `src/stores/sessionStore.ts`

- [ ] **Step 1: Add file export/import helpers to session store**

Modify: `src/stores/sessionStore.ts`

Add inside the store object after `importSessions`:

```typescript
exportToFile: () => {
  const blob = new Blob([get().exportSessions()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arona-sessions-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
},

importFromFile: (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    get().importSessions(text);
  };
  reader.readAsText(file);
},
```

Also add to `SessionState` interface:
```typescript
exportToFile: () => void;
importFromFile: (file: File) => void;
```

- [ ] **Step 2: Write SettingsModal**

Create: `src/components/settings/SettingsModal.tsx`

```typescript
import { X, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';

export function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useUIStore();
  const settings = useSettingsStore();
  const { exportToFile, importFromFile } = useSessionStore();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-[480px] max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-[0_24px_64px_var(--shadow-strong)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-bold text-[var(--text-main)]">Terminal Settings</h2>
          <button
            onClick={closeSettings}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Personality</label>
            <div className="flex items-center gap-1 mt-1.5 p-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] w-fit">
              <button
                onClick={() => settings.setPersona('arona')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  settings.persona === 'arona'
                    ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Arona
              </button>
              <button
                onClick={() => settings.setPersona('plana')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  settings.persona === 'plana'
                    ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Plana
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">API Connection</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => settings.updateConfig({ baseUrl: e.target.value })}
              placeholder="Base URL"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
            />
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => settings.updateConfig({ apiKey: e.target.value })}
              placeholder="API Key"
              className="mt-2 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Model</label>
              <input
                type="text"
                value={settings.model}
                onChange={(e) => settings.updateConfig({ model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Temperature</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => settings.updateConfig({ temperature: parseFloat(e.target.value) })}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">System Prompt</label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => settings.updateConfig({ systemPrompt: e.target.value })}
              rows={4}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none resize-y focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToFile}
              className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[11px] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              Export Sessions
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              <Upload size={12} /> Import Sessions
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/SettingsModal.tsx src/stores/sessionStore.ts
git commit -m "feat: add settings modal with import/export"
```

---

## Task 15: Assemble App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx**

Modify: `src/App.tsx`

```typescript
import { ThemeProvider } from './components/layout/ThemeProvider';
import { TopStatusBar } from './components/layout/TopStatusBar';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatPhoneFrame } from './components/chat/ChatPhoneFrame';
import { HistoryPanel } from './components/panels/HistoryPanel';
import { ActionsPanel } from './components/panels/ActionsPanel';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSessionStore } from './stores/sessionStore';
import { useEffect } from 'react';

function App() {
  const { sessions, createSession } = useSessionStore();

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <TopStatusBar />
        <DesktopLayout
          history={<HistoryPanel />}
          chat={<ChatPhoneFrame />}
          actions={<ActionsPanel />}
        />
        <MobileLayout
          chat={<ChatPhoneFrame />}
          history={<HistoryPanel />}
          tools={<ActionsPanel />}
          settings={<div className="p-4"><button onClick={() => {}} className="text-[var(--primary)]">Open Settings</button></div>}
        />
        <SettingsModal />
      </div>
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 2: Run dev server and verify**

Run:
```bash
npm run dev
```

Open browser at the displayed URL. Expected:
- Top bar shows ARONA CHAT
- Left History panel visible
- Middle chat phone frame visible
- Right Actions panel visible
- Theme toggle changes background
- Settings button opens modal

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: assemble app with desktop and mobile layouts"
```

---

## Task 16: Final Integration & Polish

**Files:**
- Modify: Various small fixes as needed
- Create: `README.md` (optional but recommended)

- [ ] **Step 1: Add mobile settings shortcut**

Modify: `src/App.tsx`

Replace the settings placeholder with:

```typescript
import { useUIStore } from './stores/uiStore';

function MobileSettingsShortcut() {
  const { openSettings } = useUIStore();
  return (
    <div className="p-4">
      <button
        onClick={openSettings}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white text-sm font-bold shadow-soft-strong"
      >
        Open Settings
      </button>
    </div>
  );
}
```

And use `<MobileSettingsShortcut />` in `MobileLayout` settings prop.

- [ ] **Step 2: Verify all tests pass**

Run:
```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 3: Add README**

Create: `README.md`

```markdown
# Arona Chat UI

A Blue-Archive-inspired Web LLM chat interface.

## Features

- Arona / Plana dual-persona themes
- OpenAI-compatible streaming chat
- History panel, chat phone frame, actions panel
- Tool call visualization
- Settings modal with import/export
- Mobile responsive layout

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- Vitest

## Development

```bash
npm install
npm run dev
npm test
```
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Arona Chat UI v1 implementation"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec Section | Implementing Task |
|--------------|-------------------|
| History panel (left) | Task 13 |
| Chat phone frame (center) | Tasks 11-12 |
| Actions panel (right) | Task 13 |
| Arona/Plana themes | Task 7 |
| Settings modal (secondary) | Task 14 |
| Tool call visualization | Task 12 |
| LLM streaming | Tasks 8-9 |
| Multi-store Zustand | Tasks 4-6 |
| Import/export | Task 14 |
| Mobile layout | Tasks 10, 15 |

**Gaps:** None. All spec requirements are covered.

### 2. Placeholder Scan

- No TBD/TODO/FIXME in plan steps.
- No "add appropriate error handling" without code.
- No "similar to Task X" shortcuts.
- Each step contains exact file paths and code.

### 3. Type Consistency

- `Persona` type used consistently across stores and components.
- `Message` and `ToolCall` interfaces match between `types/index.ts`, stores, LLM client, and UI components.
- Store action names (`createSession`, `addMessage`, etc.) consistent in store, tests, and components.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-13-arona-chat-ui-implementation.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach would you like to use?