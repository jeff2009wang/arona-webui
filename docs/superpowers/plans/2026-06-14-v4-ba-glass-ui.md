# Arona WebUI v4 — BA-like Glass UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Arona WebUI into a full-screen CG background + glass-morphism game comm overlay with MomoTalk-style chat, FAB tool drawer, multimodal image upload, and Markdown rendering.

**Architecture:** UI-layer replacement over untouched data layer. ThemeProvider gains CG background probe + renders a fixed background div. All panels use `backdrop-filter: blur()`. New `FABDrawer` (position:absolute inside `ChatFrame`) replaces the right-side `ActionsPanel`. `sessionStore` gets `partialize` to strip `images` from localStorage. Minimal additions to `lib/llm.ts` and `hooks/useLLM.ts` for `maxTokens` and vision content.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Zustand 5, Vite 6, `react-markdown` + `remark-gfm` (new), Vitest + @testing-library/react

---

## File Map

**Create:**
- `src/components/chat/ChatFrame.tsx` — glass chat container (replaces ChatPhoneFrame)
- `src/components/chat/FABDrawer.tsx` — floating action button drawer
- `src/components/chat/__tests__/ChatFrame.test.tsx`
- `src/components/chat/__tests__/FABDrawer.test.tsx`
- `public/assets/placeholders/avatar-arona.svg`
- `public/assets/placeholders/avatar-plana.svg`
- `public/assets/placeholders/avatar-user.svg`
- `public/assets/local/backgrounds/.gitkeep`

**Modify:**
- `src/types/index.ts` — add `images?`, new Settings fields
- `src/stores/settingsStore.ts` — new defaults
- `src/stores/sessionStore.ts` — add `partialize` to strip images
- `src/stores/uiStore.ts` — remove `'tools'` from MobileTab
- `src/lib/llm.ts` — pass `max_tokens`, build vision content array
- `src/hooks/useLLM.ts` — add `images` param, read `maxTokens`
- `src/index.css` — new CSS vars, dot-grid on body, remove body background
- `src/components/layout/ThemeProvider.tsx` — bg probe + fixed bg div
- `src/components/layout/DesktopLayout.tsx` — 2-column, full-height
- `src/components/layout/MobileLayout.tsx` — remove tools tab, full-height
- `src/components/panels/HistoryPanel.tsx` — glass visual refresh
- `src/components/chat/ChatHeader.tsx` — MomoTalk header
- `src/components/chat/ChatComposer.tsx` — image upload, new onSend signature
- `src/components/chat/AssistantBubble.tsx` — glass style + react-markdown
- `src/components/chat/UserBubble.tsx` — gradient style + image display
- `src/components/chat/ToolCard.tsx` — single-card state machine
- `src/components/settings/SettingsModal.tsx` — Background section + maxTokens
- `src/App.tsx` — remove TopStatusBar, use ChatFrame, remove ActionsPanel

**Delete:**
- `src/components/chat/ChatPhoneFrame.tsx`
- `src/components/chat/__tests__/ChatPhoneFrame.test.tsx`
- `src/components/panels/ActionsPanel.tsx`
- `src/components/panels/__tests__/ActionsPanel.test.tsx`
- `src/components/layout/TopStatusBar.tsx`

---

## Task 1: Install deps + extend types + data layer wiring

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/stores/sessionStore.ts`
- Modify: `src/stores/uiStore.ts`
- Modify: `src/lib/llm.ts`
- Modify: `src/hooks/useLLM.ts`

- [ ] **Step 1.1: Install react-markdown and remark-gfm**

```bash
cd /root/arona-webui && npm install react-markdown remark-gfm
```

Expected: `+ react-markdown@x.x.x + remark-gfm@x.x.x` in output. `package.json` dependencies updated.

- [ ] **Step 1.2: Extend `src/types/index.ts`**

Replace the full file:

```ts
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
  images?: string[]; // base64 data URLs, not persisted to localStorage
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
  maxTokens: number;
  systemPrompt: string;
  persona: Persona;
  enableCgBackground: boolean;
  backgroundOpacity: number; // 0–1, scales theme overlay alpha
  backgroundBlur: number;    // px, applied to background layer only
}
```

- [ ] **Step 1.3: Update `src/stores/settingsStore.ts` defaults**

Replace `defaultSettings`:

```ts
const defaultSettings: Settings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '你是一个 helpful 的 AI 助手。',
  persona: 'arona',
  enableCgBackground: true,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
};
```

Also add `setPersona` to the `useShallow` selector in `useLLM` (done in Step 1.6).

- [ ] **Step 1.4: Add `partialize` to `src/stores/sessionStore.ts`**

In the `persist(...)` call, add a `partialize` option to strip `images` before writing to localStorage. Change:

```ts
    {
      name: 'arona-sessions',
      storage: localStorageAdapter as any,
    }
```

to:

```ts
    {
      name: 'arona-sessions',
      storage: localStorageAdapter as any,
      partialize: (state) => ({
        ...state,
        sessions: state.sessions.map((s) => ({
          ...s,
          messages: s.messages.map(({ images: _images, ...m }) => m),
        })),
      }),
    }
```

- [ ] **Step 1.5: Remove `'tools'` from MobileTab in `src/stores/uiStore.ts`**

Change line 3:
```ts
type MobileTab = 'chat' | 'history' | 'settings';
```

The `initialState.activeMobileTab` is already `'chat'` so no change needed there.

- [ ] **Step 1.6: Update `src/lib/llm.ts` — maxTokens + vision content**

Replace the `body: JSON.stringify({...})` section inside `streamChatCompletion`:

```ts
    body: JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: settings.systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content:
            m.images?.length
              ? [
                  { type: 'text', text: m.content },
                  ...m.images.map((url) => ({
                    type: 'image_url',
                    image_url: { url, detail: 'auto' },
                  })),
                ]
              : m.content,
          tool_calls: m.toolCalls,
        })),
      ],
    }),
```

- [ ] **Step 1.7: Update `src/hooks/useLLM.ts` — maxTokens + images param**

In the `useShallow` selector, add `maxTokens`:

```ts
  const settings = useSettingsStore(
    useShallow((state) => ({
      baseUrl: state.baseUrl,
      apiKey: state.apiKey,
      model: state.model,
      temperature: state.temperature,
      maxTokens: state.maxTokens,
      systemPrompt: state.systemPrompt,
      persona: state.persona,
    }))
  );
```

Change `sendMessage` signature and body to accept optional `images`:

```ts
  const sendMessage = useCallback(
    async (sessionId: string, content: string, images?: string[]) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        images: images?.length ? images : undefined,
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

      const contentRef = { current: '' };
      abortControllerRef.current = new AbortController();

      try {
        await streamChatCompletion({
          settings,
          messages: session.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
          onChunk: (chunk) => {
            contentRef.current += chunk;
            updateMessage(sessionId, assistantMessage.id, {
              content: contentRef.current,
            });
          },
          signal: abortControllerRef.current.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User stopped — keep current content
        } else {
          updateMessage(sessionId, assistantMessage.id, {
            content: error instanceof LLMError ? error.message : 'Unknown error',
            status: 'error',
          });
        }
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [settings, addMessage, updateMessage, setStreaming]
  );
```

- [ ] **Step 1.8: Run existing tests to confirm no regressions**

```bash
cd /root/arona-webui && npm test -- --run 2>&1 | tail -30
```

Expected: all store and lib tests pass. Some component tests may fail (they will be fixed in later tasks when we rewrite components). Focus on `stores/` and `lib/` tests passing.

- [ ] **Step 1.9: Commit**

```bash
git add src/types/index.ts src/stores/settingsStore.ts src/stores/sessionStore.ts \
  src/stores/uiStore.ts src/lib/llm.ts src/hooks/useLLM.ts package.json package-lock.json
git commit -m "feat: extend types and data layer for v4 (maxTokens, images, new settings)"
```

---

## Task 2: CSS variables + global styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 2.1: Write failing test to verify CSS custom properties**

This is a visual layer, not unit-testable. Skip test — verify manually after Task 14 (run dev server).

- [ ] **Step 2.2: Replace `src/index.css` with v4 variables**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Layout */
    --header-height: 0px;

    /* Arona Light */
    --bg-main: #F3FBFF;
    --bg-soft: #EAF7FF;
    --card: rgba(255,255,255,0.72);
    --card-header: rgba(255,255,255,0.40);
    --line: rgba(180,235,255,0.75);
    --line-soft: rgba(180,235,255,0.40);
    --primary: #1FA8FF;
    --primary-light: #6dd5ff;
    --text-main: #1a2d40;
    --text-sub: #5a7a8a;
    --text-muted: #8faabb;
    --bubble-user-from: #6dd5ff;
    --bubble-user-to: #1FA8FF;
    --bubble-ai: rgba(255,255,255,0.88);
    --tool-bg: rgba(31,168,255,0.06);
    --hud: rgba(69,200,255,0.06);
    --shadow: rgba(45,170,230,0.18);
    --danger: #f87171;
    --status-ok: #4ade80;
  }

  [data-theme='plana'] {
    --bg-main: #0F1724;
    --bg-soft: #131D2F;
    --card: rgba(18,28,46,0.78);
    --card-header: rgba(18,28,46,0.40);
    --line: rgba(110,170,230,0.28);
    --line-soft: rgba(70,100,140,0.35);
    --primary: #69B7FF;
    --primary-light: #8DA8FF;
    --text-main: #E7F1FF;
    --text-sub: #6a90b0;
    --text-muted: #4a6a8a;
    --bubble-user-from: #3a6aa0;
    --bubble-user-to: #69B7FF;
    --bubble-ai: rgba(27,38,56,0.88);
    --tool-bg: rgba(105,183,255,0.06);
    --hud: rgba(105,183,255,0.05);
    --shadow: rgba(0,0,0,0.42);
    --danger: #f87171;
    --status-ok: #4ade80;
  }

  html {
    font-family: 'Inter', 'Noto Sans SC', sans-serif;
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: transparent; /* ThemeProvider's fixed div handles background */
    color: var(--text-main);
    overflow: hidden; /* prevent scroll bleed; panels scroll internally */
  }

  /* Layer 2: dot-grid decoration (very faint) */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, var(--hud) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
    z-index: 1; /* above bg div (z:0), below glass panels (z:2+) */
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 2.3: Commit**

```bash
git add src/index.css
git commit -m "feat: v4 CSS variables — glass theme, dot-grid, remove body background"
```

---

## Task 3: SVG placeholder assets + .gitignore

**Files:**
- Create: `public/assets/placeholders/avatar-arona.svg`
- Create: `public/assets/placeholders/avatar-plana.svg`
- Create: `public/assets/placeholders/avatar-user.svg`
- Create: `public/assets/local/backgrounds/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 3.1: Create directories**

```bash
mkdir -p /root/arona-webui/public/assets/placeholders
mkdir -p /root/arona-webui/public/assets/local/backgrounds
```

- [ ] **Step 3.2: Create `public/assets/placeholders/avatar-arona.svg`**

```svg
<!-- Self-drawn original artwork, CC0 license -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b8ecff"/>
      <stop offset="100%" stop-color="#1FA8FF"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="24" fill="url(#ag)"/>
  <!-- stylized graduation cap silhouette -->
  <rect x="12" y="22" width="24" height="3" rx="1.5" fill="white" opacity="0.9"/>
  <polygon points="24,13 36,20 24,24 12,20" fill="white" opacity="0.85"/>
  <line x1="35" y1="20" x2="35" y2="27" stroke="white" stroke-width="1.5" opacity="0.8"/>
  <circle cx="35" cy="28" r="2" fill="white" opacity="0.8"/>
</svg>
```

- [ ] **Step 3.3: Create `public/assets/placeholders/avatar-plana.svg`**

```svg
<!-- Self-drawn original artwork, CC0 license -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a4a80"/>
      <stop offset="100%" stop-color="#69B7FF"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="24" fill="url(#pg)"/>
  <!-- crescent moon -->
  <path d="M28,14 A12,12 0 1,1 28,34 A8,8 0 1,0 28,14Z" fill="white" opacity="0.85"/>
  <!-- small star -->
  <circle cx="32" cy="16" r="1.5" fill="white" opacity="0.7"/>
  <circle cx="35" cy="22" r="1" fill="white" opacity="0.5"/>
</svg>
```

- [ ] **Step 3.4: Create `public/assets/placeholders/avatar-user.svg`**

```svg
<!-- Self-drawn original artwork, CC0 license -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.6)"/>
  <!-- person silhouette -->
  <circle cx="24" cy="18" r="7" fill="rgba(90,122,138,0.6)"/>
  <path d="M8,42 Q8,30 24,30 Q40,30 40,42Z" fill="rgba(90,122,138,0.5)"/>
</svg>
```

- [ ] **Step 3.5: Create `public/assets/local/backgrounds/.gitkeep`**

```bash
touch /root/arona-webui/public/assets/local/backgrounds/.gitkeep
```

- [ ] **Step 3.6: Update `.gitignore`**

Append to the existing `.gitignore`:

```
# Visual companion brainstorm files
.superpowers/

# User-supplied local CG backgrounds (not committed — self-provide)
public/assets/local/backgrounds/arona-light.png
public/assets/local/backgrounds/arona-light.jpg
public/assets/local/backgrounds/arona-light.webp
public/assets/local/backgrounds/plana-dark.png
public/assets/local/backgrounds/plana-dark.jpg
public/assets/local/backgrounds/plana-dark.webp
```

- [ ] **Step 3.7: Commit**

```bash
git add public/assets/ .gitignore
git commit -m "feat: add self-drawn SVG avatar placeholders and local background directory"
```

---

## Task 4: ThemeProvider — CG background probe

**Files:**
- Modify: `src/components/layout/ThemeProvider.tsx`

- [ ] **Step 4.1: Write failing test**

Replace `src/components/layout/__tests__/ThemeProvider.test.tsx` (create if it doesn't exist):

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useSettingsStore } from '../../../stores/settingsStore';

vi.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

const mockSettings = {
  persona: 'arona' as const,
  enableCgBackground: false,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
};

beforeEach(() => {
  vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
    selector(mockSettings)
  );
});

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(<ThemeProvider><div data-testid="child" /></ThemeProvider>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('sets data-theme attribute on documentElement', () => {
    render(<ThemeProvider><div /></ThemeProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'arona');
  });

  it('sets data-theme to plana when persona is plana', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
      selector({ ...mockSettings, persona: 'plana' })
    );
    render(<ThemeProvider><div /></ThemeProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'plana');
  });

  it('renders a fixed background div', () => {
    const { container } = render(<ThemeProvider><div /></ThemeProvider>);
    const bgDiv = container.querySelector('[aria-hidden="true"]');
    expect(bgDiv).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/layout/__tests__/ThemeProvider.test.tsx 2>&1 | tail -20
```

Expected: fails with "cannot find module" or assertion errors.

- [ ] **Step 4.3: Implement ThemeProvider**

Replace `src/components/layout/ThemeProvider.tsx`:

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Persona } from '../../types';

const BG_PATHS: Record<Persona, string> = {
  arona: '/assets/local/backgrounds/arona-light.png',
  plana: '/assets/local/backgrounds/plana-dark.png',
};

const FALLBACK_BG: Record<Persona, string> = {
  arona: 'linear-gradient(145deg,#c9eeff 0%,#a8d8f0 18%,#d4f0ff 35%,#b8e8ff 50%,#e8f8ff 65%,#cce8f8 80%,#b0d8f0 100%)',
  plana: 'linear-gradient(145deg,#0a1322 0%,#0d1a30 40%,#091220 100%)',
};

function buildOverlay(persona: Persona, opacity: number): string {
  if (persona === 'arona') {
    const a1 = (0.72 * opacity).toFixed(2);
    const a2 = (0.86 * opacity).toFixed(2);
    return `linear-gradient(rgba(235,250,255,${a1}),rgba(235,250,255,${a2}))`;
  }
  const a1 = (0.70 * opacity).toFixed(2);
  const a2 = (0.88 * opacity).toFixed(2);
  return `linear-gradient(rgba(8,14,28,${a1}),rgba(8,14,28,${a2}))`;
}

function probeImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const persona = useSettingsStore((s) => s.persona);
  const enableCgBackground = useSettingsStore((s) => s.enableCgBackground);
  const backgroundOpacity = useSettingsStore((s) => s.backgroundOpacity);
  const backgroundBlur = useSettingsStore((s) => s.backgroundBlur);
  const [hasCgBg, setHasCgBg] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', persona);
  }, [persona]);

  useEffect(() => {
    if (!enableCgBackground) {
      setHasCgBg(false);
      return;
    }
    probeImage(BG_PATHS[persona]).then(setHasCgBg);
  }, [persona, enableCgBackground]);

  const bgStyle = hasCgBg
    ? `${buildOverlay(persona, backgroundOpacity)}, url("${BG_PATHS[persona]}") center/cover no-repeat`
    : FALLBACK_BG[persona];

  const blurPx = backgroundBlur > 0 ? backgroundBlur : undefined;
  const insetVal = blurPx ? `-${blurPx * 2}px` : '0';

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: insetVal,
          zIndex: 0,
          background: bgStyle,
          filter: blurPx ? `blur(${blurPx}px)` : undefined,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}
```

- [ ] **Step 4.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/layout/__tests__/ThemeProvider.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add src/components/layout/ThemeProvider.tsx src/components/layout/__tests__/ThemeProvider.test.tsx
git commit -m "feat: ThemeProvider — CG background probe and fixed background layer"
```

---

## Task 5: DesktopLayout — 2-column + HUD + MobileLayout

**Files:**
- Modify: `src/components/layout/DesktopLayout.tsx`
- Modify: `src/components/layout/MobileLayout.tsx`

- [ ] **Step 5.1: Replace `src/components/layout/DesktopLayout.tsx`**

```tsx
import { type ReactNode } from 'react';

export function DesktopLayout({
  history,
  chat,
}: {
  history: ReactNode;
  chat: ReactNode;
}) {
  return (
    <div className="hidden lg:grid lg:grid-cols-[210px_1fr] gap-3 p-4 h-screen">
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
      <div className="h-full overflow-hidden">{history}</div>
      <main className="h-full overflow-hidden">{chat}</main>
    </div>
  );
}
```

- [ ] **Step 5.2: Replace `src/components/layout/MobileLayout.tsx`**

Remove the `tools` tab (FAB is inside ChatFrame now). Change `MobileTab` usage to 3 tabs:

```tsx
import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { MessageSquare, Clock, Settings } from 'lucide-react';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function MobileLayout({
  chat,
  history,
  settings,
}: {
  chat: ReactNode;
  history: ReactNode;
  settings: ReactNode;
}) {
  const activeMobileTab = useUIStore((s) => s.activeMobileTab);
  const setActiveMobileTab = useUIStore((s) => s.setActiveMobileTab);

  return (
    <div className="lg:hidden flex flex-col h-screen">
      <div className="flex-1 overflow-hidden p-3 relative">
        <div hidden={activeMobileTab !== 'chat'} className="h-full">{chat}</div>
        <div hidden={activeMobileTab !== 'history'} className="h-full">{history}</div>
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
              onClick={() => setActiveMobileTab(tab.id as 'chat' | 'history' | 'settings')}
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

- [ ] **Step 5.3: Run layout tests**

```bash
cd /root/arona-webui && npm test -- --run 2>&1 | grep -E "(PASS|FAIL|ERROR)" | head -20
```

- [ ] **Step 5.4: Commit**

```bash
git add src/components/layout/DesktopLayout.tsx src/components/layout/MobileLayout.tsx
git commit -m "feat: DesktopLayout 2-column + HUD decorations; MobileLayout 3-tab"
```

---

## Task 6: HistoryPanel — glass visual refresh

**Files:**
- Modify: `src/components/panels/HistoryPanel.tsx`
- Modify: `src/components/panels/__tests__/HistoryPanel.test.tsx`

- [ ] **Step 6.1: Update the test to match new CSS classes**

Replace `src/components/panels/__tests__/HistoryPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryPanel } from '../HistoryPanel';
import { useSessionStore } from '../../../stores/sessionStore';

vi.mock('../../../stores/sessionStore', () => ({
  useSessionStore: vi.fn(),
}));

const mockSessions = [
  { id: 's1', title: 'Chat 1', messages: [{ content: 'Hello', role: 'user' }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 's2', title: 'Chat 2', messages: [], createdAt: Date.now(), updatedAt: Date.now() },
];

const mockStore = {
  sessions: mockSessions,
  currentSessionId: 's1',
  createSession: vi.fn(),
  selectSession: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: any) => selector(mockStore));
});

describe('HistoryPanel', () => {
  it('renders session titles', () => {
    render(<HistoryPanel />);
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
  });

  it('calls createSession when New Chat clicked', () => {
    render(<HistoryPanel />);
    fireEvent.click(screen.getByText(/New Chat/i));
    expect(mockStore.createSession).toHaveBeenCalledOnce();
  });

  it('calls selectSession when a session is clicked', () => {
    render(<HistoryPanel />);
    fireEvent.click(screen.getByText('Chat 2'));
    expect(mockStore.selectSession).toHaveBeenCalledWith('s2');
  });

  it('marks the active session', () => {
    render(<HistoryPanel />);
    const active = screen.getByRole('button', { name: /Chat 1/i });
    expect(active).toHaveAttribute('aria-selected', 'true');
  });
});
```

- [ ] **Step 6.2: Run test to see it fail**

```bash
cd /root/arona-webui && npm test -- --run src/components/panels/__tests__/HistoryPanel.test.tsx 2>&1 | tail -20
```

- [ ] **Step 6.3: Rewrite `src/components/panels/HistoryPanel.tsx`**

```tsx
import { Plus } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export function HistoryPanel() {
  const sessions = useSessionStore((s) => s.sessions);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const createSession = useSessionStore((s) => s.createSession);
  const selectSession = useSessionStore((s) => s.selectSession);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--line)',
        borderRadius: 20,
        boxShadow: '0 8px 32px var(--shadow)',
      }}
    >
      {/* Header */}
      <div
        className="px-3 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--card-header)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: 'var(--primary)' }}
          >
            Chats
          </span>
          <span
            className="text-[8px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--tool-bg)', color: 'var(--text-muted)', border: '1px solid var(--line-soft)' }}
          >
            {sessions.length}
          </span>
        </div>
        <button
          onClick={createSession}
          aria-label="Create new chat session"
          className="w-full py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            border: '1.5px dashed var(--primary)',
            color: 'var(--primary)',
            background: 'rgba(31,168,255,0.04)',
          }}
        >
          <Plus size={11} />
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1" role="list">
        {sessions.map((session) => {
          const isActive = currentSessionId === session.id;
          const lastMsg = session.messages.at(-1)?.content ?? '';
          return (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              role="button"
              aria-selected={isActive}
              aria-label={session.title}
              className="flex items-center gap-2 p-2 rounded-[13px] text-left transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
              style={{
                background: isActive ? 'rgba(31,168,255,0.10)' : 'rgba(255,255,255,0.25)',
                border: isActive ? '1px solid rgba(31,168,255,0.38)' : '1px solid transparent',
              }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-[9px] grid place-items-center text-sm shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                  boxShadow: '0 2px 8px var(--shadow)',
                }}
                aria-hidden="true"
              >
                🎓
              </div>
              {/* Meta */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11px] font-bold truncate"
                  style={{ color: 'var(--text-main)' }}
                >
                  {session.title}
                </div>
                <div
                  className="text-[9px] truncate mt-0.5"
                  style={{ color: 'var(--text-sub)' }}
                >
                  {lastMsg.slice(0, 28) || 'No messages'}
                </div>
              </div>
              {/* Time */}
              <div className="text-[8px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                {timeAgo(session.updatedAt)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/panels/__tests__/HistoryPanel.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 6.5: Commit**

```bash
git add src/components/panels/HistoryPanel.tsx src/components/panels/__tests__/HistoryPanel.test.tsx
git commit -m "feat: HistoryPanel glass visual refresh"
```

---

## Task 7: ChatHeader — MomoTalk style

**Files:**
- Modify: `src/components/chat/ChatHeader.tsx`
- Modify: `src/components/chat/__tests__/ChatHeader.test.tsx`

- [ ] **Step 7.1: Write updated test**

Replace `src/components/chat/__tests__/ChatHeader.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatHeader } from '../ChatHeader';

describe('ChatHeader', () => {
  it('renders character name', () => {
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={vi.fn()} isStreaming={false} model="gpt-4o" />);
    expect(screen.getByText('Arona')).toBeInTheDocument();
  });

  it('renders model tag', () => {
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={vi.fn()} isStreaming={false} model="gpt-4o-mini" />);
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
  });

  it('calls onStop when stop button clicked during streaming', () => {
    const onStop = vi.fn();
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={onStop} isStreaming={true} model="gpt-4o" />);
    fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('does not show stop button when not streaming', () => {
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={vi.fn()} isStreaming={false} model="gpt-4o" />);
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
  });
});
```

- [ ] **Step 7.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ChatHeader.test.tsx 2>&1 | tail -20
```

- [ ] **Step 7.3: Replace `src/components/chat/ChatHeader.tsx`**

```tsx
import { Square } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  status: string;
  avatar: string;
  onStop: () => void;
  isStreaming: boolean;
  model: string;
}

export function ChatHeader({ name, status, avatar, onStop, isStreaming, model }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        borderBottom: '1px solid var(--line-soft)',
        background: 'var(--card-header)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={avatar}
          alt={name}
          width={40}
          height={40}
          style={{
            borderRadius: '50%',
            boxShadow: '0 3px 12px var(--shadow)',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Online indicator */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--status-ok)', border: '2px solid white',
          }}
        />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-black truncate" style={{ color: 'var(--text-main)' }}>
          {name}
        </div>
        <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-sub)' }}>
          <span
            aria-hidden="true"
            style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-ok)', flexShrink: 0 }}
          />
          {status}
        </div>
      </div>

      {/* Model tag */}
      <span
        className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full"
        style={{
          background: 'var(--tool-bg)',
          border: '1px solid var(--line)',
          color: 'var(--primary)',
        }}
      >
        {model}
      </span>

      {/* Stop button — only during streaming */}
      {isStreaming && (
        <button
          onClick={onStop}
          aria-label="Stop generation"
          className="w-8 h-8 rounded-full grid place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'var(--tool-bg)',
            border: '1px solid var(--line)',
            color: 'var(--text-sub)',
          }}
        >
          <Square size={12} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 7.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ChatHeader.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 7.5: Commit**

```bash
git add src/components/chat/ChatHeader.tsx src/components/chat/__tests__/ChatHeader.test.tsx
git commit -m "feat: ChatHeader MomoTalk style — avatar, model tag, stop button"
```

---

## Task 8: ToolCard — single-card state machine

**Files:**
- Modify: `src/components/chat/ToolCard.tsx`
- Modify: `src/components/chat/__tests__/ToolCard.test.tsx`

- [ ] **Step 8.1: Write updated test**

Replace `src/components/chat/__tests__/ToolCard.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToolCard } from '../ToolCard';
import type { ToolCall } from '../../../types';

const base: ToolCall = {
  id: 'tc1',
  name: 'web_search',
  arguments: { query: 'test' },
  status: 'running',
  startedAt: Date.now(),
};

describe('ToolCard', () => {
  it('shows spinner and TOOL CALL label when running', () => {
    render(<ToolCard toolCall={base} />);
    expect(screen.getByText(/TOOL CALL/i)).toBeInTheDocument();
    expect(screen.getByText('web_search')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
  });

  it('shows checkmark and TOOL RESULT when success', () => {
    render(<ToolCard toolCall={{ ...base, status: 'success', result: 'found 3 results', finishedAt: Date.now() }} />);
    expect(screen.getByText(/TOOL RESULT/i)).toBeInTheDocument();
    expect(screen.getByText(/found 3 results/i)).toBeInTheDocument();
  });

  it('shows error icon and TOOL ERROR when error', () => {
    render(<ToolCard toolCall={{ ...base, status: 'error', result: '403 Forbidden', finishedAt: Date.now() }} />);
    expect(screen.getByText(/TOOL ERROR/i)).toBeInTheDocument();
    expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
  });

  it('toggles expanded details on click', () => {
    render(<ToolCard toolCall={{ ...base, status: 'success', result: { key: 'value' }, finishedAt: Date.now() }} />);
    expect(screen.queryByText(/key/)).toBeNull();
    fireEvent.click(screen.getByText(/展开详情/i));
    expect(screen.getByText(/"key"/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/收起/i));
    expect(screen.queryByText(/"key"/)).toBeNull();
  });
});
```

- [ ] **Step 8.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ToolCard.test.tsx 2>&1 | tail -20
```

- [ ] **Step 8.3: Replace `src/components/chat/ToolCard.tsx`**

```tsx
import { useState } from 'react';
import type { ToolCall } from '../../types';

const STATE_CONFIG = {
  running: {
    label: 'TOOL CALL',
    accentColor: 'var(--primary)',
    bgAlpha: 'rgba(31,168,255,0.06)',
    borderAlpha: 'rgba(31,168,255,0.22)',
  },
  success: {
    label: 'TOOL RESULT',
    accentColor: '#22c55e',
    bgAlpha: 'rgba(74,222,128,0.05)',
    borderAlpha: 'rgba(74,222,128,0.20)',
  },
  error: {
    label: 'TOOL ERROR',
    accentColor: '#f87171',
    bgAlpha: 'rgba(248,113,113,0.06)',
    borderAlpha: 'rgba(248,113,113,0.20)',
  },
} as const;

interface ToolCardProps {
  toolCall: ToolCall;
}

export function ToolCard({ toolCall }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATE_CONFIG[toolCall.status];
  const isRunning = toolCall.status === 'running';

  const resultText =
    toolCall.result !== undefined
      ? typeof toolCall.result === 'string'
        ? toolCall.result
        : JSON.stringify(toolCall.result, null, 2)
      : '';

  return (
    <div
      className="max-w-[78%]"
      style={{
        background: cfg.bgAlpha,
        border: `1px solid ${cfg.borderAlpha}`,
        borderLeft: `3px solid ${cfg.accentColor}`,
        borderRadius: 16,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${cfg.borderAlpha}` }}
      >
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span
              role="status"
              aria-label="Loading"
              style={{
                display: 'inline-block', width: 10, height: 10,
                borderRadius: '50%',
                border: `1.5px solid rgba(31,168,255,0.2)`,
                borderTopColor: 'var(--primary)',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: cfg.accentColor }}>
              {toolCall.status === 'success' ? '✓' : '✗'}
            </span>
          )}
          <span
            className="font-black uppercase tracking-wider"
            style={{ fontSize: 8, color: cfg.accentColor }}
          >
            {cfg.label}
          </span>
        </div>

        <span
          className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full"
          style={{
            fontSize: 8,
            background: cfg.bgAlpha,
            border: `1px solid ${cfg.borderAlpha}`,
            color: cfg.accentColor,
          }}
        >
          {isRunning && (
            <span
              aria-hidden="true"
              style={{
                width: 4, height: 4, borderRadius: '50%',
                background: cfg.accentColor,
                animation: 'pulse 1s ease-in-out infinite',
              }}
            />
          )}
          {isRunning ? 'Running' : toolCall.status === 'success' ? `Done` : 'Failed'}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="font-bold" style={{ fontSize: 12, color: 'var(--text-main)' }}>
          {toolCall.name}
        </div>

        {isRunning ? (
          <div className="mt-1" style={{ fontSize: 10, color: 'var(--text-sub)' }}>
            正在调用...
          </div>
        ) : (
          <div
            className="mt-1"
            style={{
              fontSize: 10,
              color: toolCall.status === 'error' ? '#dc2626' : '#16a34a',
            }}
          >
            {resultText.length > 80 && !expanded
              ? resultText.slice(0, 80) + '…'
              : !expanded
              ? resultText
              : null}
          </div>
        )}

        {/* Expanded code block */}
        {expanded && resultText && (
          <pre
            style={{
              fontFamily: "'SF Mono', 'Menlo', monospace",
              fontSize: 10, lineHeight: 1.55,
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid var(--line-soft)',
              borderRadius: 10,
              padding: '8px 10px',
              overflowX: 'auto',
              marginTop: 8,
              color: 'var(--text-sub)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {resultText}
          </pre>
        )}
      </div>

      {/* Footer toggle */}
      {!isRunning && resultText && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:rounded focus-visible:outline-none"
            style={{ fontSize: 9, color: 'var(--text-muted)' }}
          >
            {expanded ? '▲ 收起' : '▼ 展开详情'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 8.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ToolCard.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 8.5: Commit**

```bash
git add src/components/chat/ToolCard.tsx src/components/chat/__tests__/ToolCard.test.tsx
git commit -m "feat: ToolCard single-card state machine (running/success/error + expand)"
```

---

## Task 9: FABDrawer — floating action component

**Files:**
- Create: `src/components/chat/FABDrawer.tsx`
- Create: `src/components/chat/__tests__/FABDrawer.test.tsx`

- [ ] **Step 9.1: Write the test**

Create `src/components/chat/__tests__/FABDrawer.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FABDrawer } from '../FABDrawer';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';
import { useLLM } from '../../../hooks/useLLM';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

const mockStop = vi.fn();
const mockClear = vi.fn();
const mockExport = vi.fn();
const mockOpenSettings = vi.fn();

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: any) =>
    selector({ isStreaming: false, currentSessionId: 's1', clearSession: mockClear, exportToFile: mockExport })
  );
  vi.mocked(useUIStore).mockImplementation((selector: any) =>
    selector({ openSettings: mockOpenSettings })
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: mockStop });
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

  it('calls clearSession when clear sub-button clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(mockClear).toHaveBeenCalledWith('s1');
  });
});
```

- [ ] **Step 9.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/FABDrawer.test.tsx 2>&1 | tail -20
```

Expected: fails — module not found.

- [ ] **Step 9.3: Create `src/components/chat/FABDrawer.tsx`**

```tsx
import { useState, useEffect, useRef } from 'react';
import { Settings, Trash2, Upload, Square } from 'lucide-react';
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
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const clearSession = useSessionStore((s) => s.clearSession);
  const exportToFile = useSessionStore((s) => s.exportToFile);
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
      onClick: () => { if (currentSessionId) clearSession(currentSessionId); setOpen(false); },
      danger: true,
    },
    {
      icon: <Upload size={13} />,
      label: 'Export',
      onClick: () => { exportToFile(); setOpen(false); },
    },
    {
      icon: <Settings size={13} />,
      label: 'Settings',
      onClick: () => { openSettings(); setOpen(false); },
    },
  ];

  return (
    <div
      ref={ref}
      style={{ position: 'absolute', bottom: 62, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      {/* Sub-buttons (shown when open) */}
      {subButtons.map((btn, i) => (
        <button
          key={btn.label}
          aria-label={btn.label}
          onClick={btn.onClick}
          disabled={btn.disabled}
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
            opacity: !open ? 0 : btn.disabled ? 0.4 : 1,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.85)',
            pointerEvents: open ? 'auto' : 'none',
            transition: `transform 0.2s cubic-bezier(.34,1.56,.64,1) ${i * 40}ms, opacity 0.15s ${i * 40}ms`,
          }}
        >
          {btn.icon}
        </button>
      ))}

      {/* Main FAB */}
      <button
        aria-label="Tools menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
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
      </button>
    </div>
  );
}
```

- [ ] **Step 9.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/FABDrawer.test.tsx 2>&1 | tail -20
```

Expected: 5 tests pass.

- [ ] **Step 9.5: Commit**

```bash
git add src/components/chat/FABDrawer.tsx src/components/chat/__tests__/FABDrawer.test.tsx
git commit -m "feat: FABDrawer — glass floating action button with expand/collapse"
```

---

## Task 10: AssistantBubble — glass style + Markdown

**Files:**
- Modify: `src/components/chat/AssistantBubble.tsx`
- Modify: `src/components/chat/__tests__/AssistantBubble.test.tsx`

- [ ] **Step 10.1: Write updated test**

Replace `src/components/chat/__tests__/AssistantBubble.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssistantBubble } from '../AssistantBubble';
import type { Message } from '../../../types';

const base: Message = { id: 'm1', role: 'assistant', content: 'Hello!', createdAt: 1700000000000 };

describe('AssistantBubble', () => {
  it('renders text content', () => {
    render(<AssistantBubble message={base} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('renders markdown bold', () => {
    render(<AssistantBubble message={{ ...base, content: '**bold text**' }} />);
    expect(screen.getByText('bold text').tagName).toBe('STRONG');
  });

  it('renders markdown code block', () => {
    render(<AssistantBubble message={{ ...base, content: '```\ncode here\n```' }} />);
    expect(screen.getByText('code here')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<AssistantBubble message={base} />);
    // timestamp renders as HH:MM
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/AssistantBubble.test.tsx 2>&1 | tail -20
```

- [ ] **Step 10.3: Replace `src/components/chat/AssistantBubble.tsx`**

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types';
import type { Components } from 'react-markdown';

const mdComponents: Components = {
  p: ({ children }) => <p style={{ margin: '0 0 0.5em', lineHeight: 1.6 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text-main)' }}>{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = !!className;
    return isBlock ? (
      <code style={{ display: 'block', fontFamily: "'SF Mono','Menlo',monospace", fontSize: 11, lineHeight: 1.55 }}>
        {children}
      </code>
    ) : (
      <code style={{ fontFamily: "'SF Mono','Menlo',monospace", background: 'var(--tool-bg)', borderRadius: 4, padding: '1px 5px', fontSize: '0.85em' }}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: '10px 12px', overflowX: 'auto', margin: '0.5em 0' }}>
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '0.2em' }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 10, color: 'var(--text-sub)', margin: '0.5em 0' }}>
      {children}
    </blockquote>
  ),
  table: ({ children }) => <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>{children}</table>,
  th: ({ children }) => <th style={{ border: '1px solid var(--line)', padding: '5px 9px', background: 'var(--tool-bg)', fontWeight: 700 }}>{children}</th>,
  td: ({ children }) => <td style={{ border: '1px solid var(--line)', padding: '5px 9px' }}>{children}</td>,
};

export function AssistantBubble({ message }: { message: Message }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-end gap-2">
      {/* Avatar */}
      <img
        src="/assets/placeholders/avatar-arona.svg"
        alt="Arona"
        width={28}
        height={28}
        style={{ borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 8px var(--shadow)' }}
      />
      <div>
        {/* Bubble */}
        <div
          style={{
            maxWidth: '68%',
            padding: '10px 14px',
            borderRadius: 18,
            borderBottomLeftRadius: 4,
            background: 'var(--bubble-ai)',
            border: '1px solid var(--line-soft)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px var(--shadow)',
            fontSize: 12,
            color: 'var(--text-main)',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
        {/* Timestamp */}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
          {time}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 10.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/AssistantBubble.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 10.5: Commit**

```bash
git add src/components/chat/AssistantBubble.tsx src/components/chat/__tests__/AssistantBubble.test.tsx
git commit -m "feat: AssistantBubble glass style + react-markdown rendering"
```

---

## Task 11: UserBubble — gradient + image display

**Files:**
- Modify: `src/components/chat/UserBubble.tsx`
- Modify: `src/components/chat/__tests__/UserBubble.test.tsx`

- [ ] **Step 11.1: Write updated test**

Replace `src/components/chat/__tests__/UserBubble.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserBubble } from '../UserBubble';
import type { Message } from '../../../types';

const base: Message = { id: 'm1', role: 'user', content: 'Hello!', createdAt: 1700000000000 };

describe('UserBubble', () => {
  it('renders message content', () => {
    render(<UserBubble message={base} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<UserBubble message={base} />);
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders image thumbnails when images present', () => {
    const msg = { ...base, images: ['data:image/png;base64,abc123', 'data:image/png;base64,def456'] };
    render(<UserBubble message={msg} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('shows no images when images array is empty', () => {
    render(<UserBubble message={{ ...base, images: [] }} />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
```

- [ ] **Step 11.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/UserBubble.test.tsx 2>&1 | tail -20
```

- [ ] **Step 11.3: Replace `src/components/chat/UserBubble.tsx`**

```tsx
import { useState } from 'react';
import type { Message } from '../../types';

export function UserBubble({ message }: { message: Message }) {
  const [preview, setPreview] = useState<string | null>(null);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasImages = message.images && message.images.length > 0;

  return (
    <div className="flex items-end justify-end gap-2">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '68%' }}>
        {/* Image thumbnails */}
        {hasImages && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {message.images!.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Attachment ${i + 1}`}
                onClick={() => setPreview(src)}
                style={{
                  width: 72, height: 72, objectFit: 'cover',
                  borderRadius: 12, cursor: 'pointer',
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 8px var(--shadow)',
                }}
              />
            ))}
          </div>
        )}

        {/* Text bubble */}
        {message.content && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 18,
              borderBottomRightRadius: 4,
              background: 'linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))',
              color: 'white',
              fontSize: 12,
              lineHeight: 1.6,
              boxShadow: '0 6px 20px var(--shadow)',
            }}
          >
            {message.content}
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
          {time}
        </div>
      </div>

      {/* User avatar */}
      <img
        src="/assets/placeholders/avatar-user.svg"
        alt="You"
        width={28}
        height={28}
        style={{ borderRadius: '50%', flexShrink: 0, border: '1.5px solid var(--line)' }}
      />

      {/* Full-screen image preview dialog */}
      {preview && (
        <dialog
          open
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100vw', maxWidth: '100vw', maxHeight: '100vh',
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
          />
        </dialog>
      )}
    </div>
  );
}
```

- [ ] **Step 11.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/UserBubble.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 11.5: Commit**

```bash
git add src/components/chat/UserBubble.tsx src/components/chat/__tests__/UserBubble.test.tsx
git commit -m "feat: UserBubble gradient style + image thumbnail display"
```

---

## Task 12: ChatComposer — image upload

**Files:**
- Modify: `src/components/chat/ChatComposer.tsx`
- Modify: `src/components/chat/__tests__/ChatComposer.test.tsx`

- [ ] **Step 12.1: Write updated test**

Replace `src/components/chat/__tests__/ChatComposer.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatComposer } from '../ChatComposer';

describe('ChatComposer', () => {
  it('renders input and send button', () => {
    render(<ChatComposer onSend={vi.fn()} disabled={false} />);
    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onSend with text and empty images on Enter', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={false} />);
    const input = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('does not call onSend when disabled', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={true} />);
    const input = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders image attach button', () => {
    render(<ChatComposer onSend={vi.fn()} disabled={false} />);
    expect(screen.getByRole('button', { name: /attach image/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 12.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ChatComposer.test.tsx 2>&1 | tail -20
```

- [ ] **Step 12.3: Replace `src/components/chat/ChatComposer.tsx`**

```tsx
import { useState, useRef, useCallback } from 'react';
import { Send, ImagePlus, X } from 'lucide-react';

interface ChatComposerProps {
  onSend: (text: string, images: string[]) => void;
  disabled?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && images.length === 0) || disabled) return;
    onSend(trimmed, images);
    setValue('');
    setImages([]);
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

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const results = await Promise.all(Array.from(files).map(fileToBase64));
    setImages((prev) => [...prev, ...results]);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageFiles = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach((f) => dt.items.add(f));
      handleFiles(dt.files);
    }
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--card-header)', backdropFilter: 'blur(8px)', flexShrink: 0 }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Image preview strip */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px 0', overflowX: 'auto' }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1.5px solid var(--line)' }}
              />
              <button
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove image ${i + 1}`}
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#f87171', border: 'none',
                  display: 'grid', placeItems: 'center',
                  cursor: 'pointer', color: 'white',
                }}
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        {/* Attach image button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          disabled={disabled}
          className="shrink-0 w-9 h-9 rounded-xl grid place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'var(--tool-bg)',
            border: '1px solid var(--line)',
            color: 'var(--text-sub)',
          }}
        >
          <ImagePlus size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
          placeholder="发送消息给 Arona..."
          rows={1}
          disabled={disabled}
          aria-label="Message input"
          className="flex-1 min-h-[40px] max-h-[120px] px-4 py-3 rounded-2xl text-xs outline-none resize-none transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'rgba(255,255,255,0.65)',
            border: '1.5px solid var(--line)',
            color: 'var(--text-main)',
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && images.length === 0)}
          aria-label="Send message"
          className="shrink-0 w-10 h-10 rounded-full grid place-items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
            boxShadow: '0 4px 14px var(--shadow)',
            border: 'none',
            color: 'white',
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 12.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ChatComposer.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 12.5: Commit**

```bash
git add src/components/chat/ChatComposer.tsx src/components/chat/__tests__/ChatComposer.test.tsx
git commit -m "feat: ChatComposer image upload — file picker, paste, drag-drop, preview strip"
```

---

## Task 13: ChatFrame — glass container (rename + rewire)

**Files:**
- Create: `src/components/chat/ChatFrame.tsx`
- Create: `src/components/chat/__tests__/ChatFrame.test.tsx`
- Delete: `src/components/chat/ChatPhoneFrame.tsx`
- Delete: `src/components/chat/__tests__/ChatPhoneFrame.test.tsx`

- [ ] **Step 13.1: Write the test**

Create `src/components/chat/__tests__/ChatFrame.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatFrame } from '../ChatFrame';
import { useSessionStore } from '../../../stores/sessionStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useLLM } from '../../../hooks/useLLM';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

vi.mock('../FABDrawer', () => ({ FABDrawer: () => <div data-testid="fab-drawer" /> }));
vi.mock('../ChatHeader', () => ({ ChatHeader: (p: any) => <div data-testid="chat-header">{p.name}</div> }));
vi.mock('../ChatComposer', () => ({ ChatComposer: () => <div data-testid="chat-composer" /> }));
vi.mock('../AssistantBubble', () => ({ AssistantBubble: (p: any) => <div>{p.message.content}</div> }));
vi.mock('../UserBubble', () => ({ UserBubble: (p: any) => <div>{p.message.content}</div> }));
vi.mock('../ToolCard', () => ({ ToolCard: () => <div>tool</div> }));
vi.mock('../TypingIndicator', () => ({ TypingIndicator: () => <div>typing</div> }));

const mockSession = {
  id: 's1', title: 'Test', messages: [
    { id: 'm1', role: 'user', content: 'hi', createdAt: Date.now() },
    { id: 'm2', role: 'assistant', content: 'hello', createdAt: Date.now() },
  ], createdAt: Date.now(), updatedAt: Date.now(),
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((s: any) =>
    s({ sessions: [mockSession], currentSessionId: 's1', isStreaming: false })
  );
  vi.mocked(useSettingsStore).mockImplementation((s: any) =>
    s({ persona: 'arona', model: 'gpt-4o-mini' })
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: vi.fn() });
});

describe('ChatFrame', () => {
  it('renders chat header', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
  });

  it('renders FABDrawer', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('fab-drawer')).toBeInTheDocument();
  });

  it('renders chat composer', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });

  it('renders user and assistant messages', () => {
    render(<ChatFrame />);
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 13.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ChatFrame.test.tsx 2>&1 | tail -20
```

Expected: fails — module not found.

- [ ] **Step 13.3: Create `src/components/chat/ChatFrame.tsx`**

```tsx
import { useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { AssistantBubble } from './AssistantBubble';
import { UserBubble } from './UserBubble';
import { ToolCard } from './ToolCard';
import { TypingIndicator } from './TypingIndicator';
import { ChatComposer } from './ChatComposer';
import { FABDrawer } from './FABDrawer';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLLM } from '../../hooks/useLLM';
import type { Message } from '../../types';

const AVATAR: Record<string, string> = {
  arona: '/assets/placeholders/avatar-arona.svg',
  plana: '/assets/placeholders/avatar-plana.svg',
};

const CHAR_NAME: Record<string, string> = { arona: 'Arona', plana: 'Plana' };
const CHAR_STATUS: Record<string, string> = {
  arona: 'Online · Schale Terminal',
  plana: 'Online · Aria Terminal',
};

function renderMessage(message: Message) {
  if (message.role === 'user') return <UserBubble key={message.id} message={message} />;
  if (message.role === 'assistant') return <AssistantBubble key={message.id} message={message} />;
  if (message.role === 'tool' && message.toolCalls) {
    return (
      <div key={message.id} className="flex flex-col gap-2">
        {message.toolCalls.map((tc) => <ToolCard key={tc.id} toolCall={tc} />)}
      </div>
    );
  }
  return null;
}

export function ChatFrame() {
  const persona = useSettingsStore((s) => s.persona);
  const model = useSettingsStore((s) => s.model);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const { sendMessage, stop } = useLLM();

  const session = sessions.find((s) => s.id === currentSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages.length, isStreaming]);

  const handleSend = (text: string, images: string[]) => {
    if (currentSessionId) sendMessage(currentSessionId, text, images);
  };

  return (
    <div
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

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {session?.messages.map(renderMessage)}
        {isStreaming && <TypingIndicator />}
      </div>

      {/* FAB overlay */}
      <FABDrawer />

      <ChatComposer onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

- [ ] **Step 13.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/chat/__tests__/ChatFrame.test.tsx 2>&1 | tail -20
```

Expected: 4 tests pass.

- [ ] **Step 13.5: Update `src/components/chat/TypingIndicator.tsx` to use v4 CSS vars**

`TypingIndicator` still references old `--border` and `--bubble-assistant` vars. Replace the file:

```tsx
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <img
        src="/assets/placeholders/avatar-arona.svg"
        alt="Typing"
        width={28}
        height={28}
        style={{ borderRadius: '50%', flexShrink: 0 }}
      />
      <div
        className="flex items-center gap-1 px-4 py-3"
        style={{
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          background: 'var(--bubble-ai)',
          border: '1px solid var(--line-soft)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            data-testid="typing-dot"
            className="w-[5px] h-[5px] rounded-full motion-safe:animate-bounce"
            style={{ background: 'var(--primary)', animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 13.6: Delete old ChatPhoneFrame files**

```bash
rm /root/arona-webui/src/components/chat/ChatPhoneFrame.tsx
rm /root/arona-webui/src/components/chat/__tests__/ChatPhoneFrame.test.tsx
```

- [ ] **Step 13.7: Commit**

```bash
git add src/components/chat/ChatFrame.tsx src/components/chat/__tests__/ChatFrame.test.tsx \
  src/components/chat/TypingIndicator.tsx
git rm src/components/chat/ChatPhoneFrame.tsx src/components/chat/__tests__/ChatPhoneFrame.test.tsx
git commit -m "feat: ChatFrame glass container with FABDrawer and auto-scroll; update TypingIndicator vars"
```

---

## Task 14: SettingsModal — Background section + maxTokens

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/components/settings/__tests__/SettingsModal.test.tsx`

- [ ] **Step 14.1: Write updated test**

Replace `src/components/settings/__tests__/SettingsModal.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from '../SettingsModal';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';

vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));

const mockUpdate = vi.fn();
const mockSetPersona = vi.fn();
const mockClose = vi.fn();
const mockExport = vi.fn();

beforeEach(() => {
  vi.mocked(useUIStore).mockImplementation((s: any) =>
    s({ isSettingsOpen: true, closeSettings: mockClose })
  );
  vi.mocked(useSettingsStore).mockImplementation((s: any) =>
    s({
      persona: 'arona', baseUrl: 'http://api', apiKey: 'sk-x', model: 'gpt-4o-mini',
      temperature: 0.7, maxTokens: 2048, systemPrompt: 'You are helpful.',
      enableCgBackground: true, backgroundOpacity: 0.75, backgroundBlur: 0,
      updateConfig: mockUpdate, setPersona: mockSetPersona, resetToDefaults: vi.fn(),
    })
  );
  vi.mocked(useSessionStore).mockImplementation((s: any) =>
    s({ exportToFile: mockExport, importFromFile: vi.fn() })
  );
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

  it('calls closeSettings when close button clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls setPersona when Plana is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /plana/i }));
    expect(mockSetPersona).toHaveBeenCalledWith('plana');
  });

  it('does not render when closed', () => {
    vi.mocked(useUIStore).mockImplementation((s: any) =>
      s({ isSettingsOpen: false, closeSettings: mockClose })
    );
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
```

- [ ] **Step 14.2: Run test to verify it fails**

```bash
cd /root/arona-webui && npm test -- --run src/components/settings/__tests__/SettingsModal.test.tsx 2>&1 | tail -20
```

- [ ] **Step 14.3: Replace `src/components/settings/SettingsModal.tsx`**

```tsx
import { X, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';

export function SettingsModal() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const { persona, baseUrl, apiKey, model, temperature, maxTokens, systemPrompt,
          enableCgBackground, backgroundOpacity, backgroundBlur,
          updateConfig, setPersona, resetToDefaults } = useSettingsStore((s) => s);
  const exportToFile = useSessionStore((s) => s.exportToFile);
  const importFromFile = useSessionStore((s) => s.importFromFile);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  const field = (label: string, id: string, node: React.ReactNode) => (
    <div>
      <label htmlFor={id} className="block text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {node}
    </div>
  );

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-[11px] outline-none transition-all focus:shadow-[0_0_0_3px_var(--hud)]";
  const inputStyle = { background: 'var(--tool-bg)', border: '1.5px solid var(--line)', color: 'var(--text-main)' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-[480px] max-h-[82vh] flex flex-col overflow-hidden"
        style={{
          background: 'var(--card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          boxShadow: '0 24px 80px var(--shadow)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--card-header)' }}
        >
          <h2 className="text-[14px] font-black" style={{ color: 'var(--text-main)' }}>Settings</h2>
          <button
            onClick={closeSettings}
            aria-label="Close settings"
            className="w-8 h-8 rounded-xl grid place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            style={{ background: 'var(--tool-bg)', border: '1px solid var(--line)', color: 'var(--text-sub)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Theme */}
          <div>
            <div className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-2">Theme</div>
            <div className="flex items-center gap-1 p-1 rounded-full w-fit" style={{ background: 'var(--tool-bg)', border: '1px solid var(--line)' }}>
              {(['arona', 'plana'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  aria-pressed={persona === p}
                  aria-label={p === 'arona' ? 'Arona' : 'Plana'}
                  className="px-4 py-1.5 rounded-full text-[10px] font-black capitalize transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                  style={persona === p
                    ? { background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', color: 'white' }
                    : { color: 'var(--text-sub)' }}
                >
                  {p === 'arona' ? 'Arona' : 'Plana'}
                </button>
              ))}
            </div>
          </div>

          {/* API Connection */}
          {field('API Connection', 'settings-base-url',
            <>
              <input id="settings-base-url" type="text" value={baseUrl} placeholder="Base URL"
                onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                className={inputClass} style={inputStyle} />
              <input id="settings-api-key" type="password" value={apiKey} placeholder="API Key"
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                className={`${inputClass} mt-2`} style={inputStyle} />
            </>
          )}

          {/* Model + Temperature + Max Tokens */}
          <div className="grid grid-cols-3 gap-3">
            {field('Model', 'settings-model',
              <input id="settings-model" type="text" value={model} placeholder="gpt-4o-mini"
                onChange={(e) => updateConfig({ model: e.target.value })}
                className={inputClass} style={inputStyle} />
            )}
            {field('Temperature', 'settings-temperature',
              <input id="settings-temperature" type="number" min="0" max="2" step="0.1" value={temperature}
                onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                className={inputClass} style={inputStyle} />
            )}
            {field('Max Tokens', 'settings-max-tokens',
              <input id="settings-max-tokens" type="number" min="256" max="128000" step="256" value={maxTokens}
                aria-label="Max tokens"
                onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value, 10) })}
                className={inputClass} style={inputStyle} />
            )}
          </div>

          {/* System Prompt */}
          {field('System Prompt', 'settings-system-prompt',
            <textarea id="settings-system-prompt" value={systemPrompt} rows={4}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              className={`${inputClass} resize-y`} style={inputStyle} />
          )}

          {/* Background */}
          <div>
            <div className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-3">Background</div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCgBackground}
                  aria-label="Enable CG background"
                  onChange={(e) => updateConfig({ enableCgBackground: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--primary)]"
                />
                <span className="text-[11px]" style={{ color: 'var(--text-main)' }}>Enable CG Background</span>
              </label>

              <div>
                <label className="text-[10px] font-semibold" style={{ color: 'var(--text-sub)' }}>
                  Overlay Opacity: {Math.round(backgroundOpacity * 100)}%
                </label>
                <input
                  type="range" min="0" max="1" step="0.05" value={backgroundOpacity}
                  onChange={(e) => updateConfig({ backgroundOpacity: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold" style={{ color: 'var(--text-sub)' }}>
                  Background Blur: {backgroundBlur}px
                </label>
                <input
                  type="range" min="0" max="20" step="1" value={backgroundBlur}
                  onChange={(e) => updateConfig({ backgroundBlur: parseInt(e.target.value, 10) })}
                  className="w-full mt-1 accent-[var(--primary)]"
                />
              </div>

              <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                Place your background at:<br />
                <code style={{ fontSize: 9 }}>public/assets/local/backgrounds/arona-light.png</code><br />
                <code style={{ fontSize: 9 }}>public/assets/local/backgrounds/plana-dark.png</code>
              </p>

              <button
                onClick={() => updateConfig({ enableCgBackground: true, backgroundOpacity: 0.75, backgroundBlur: 0 })}
                className="text-[10px] font-semibold px-3 py-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                style={{ border: '1px solid var(--line)', color: 'var(--text-sub)', background: 'var(--tool-bg)' }}
              >
                Reset Background to Defaults
              </button>
            </div>
          </div>

          {/* Export / Import */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToFile}
              aria-label="Export sessions to JSON file"
              className="py-2.5 rounded-xl text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
              style={{ border: '1px solid var(--line)', color: 'var(--text-sub)', background: 'var(--tool-bg)' }}
            >
              Export Sessions
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Import sessions from JSON file"
              className="py-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
              style={{ border: '1px solid var(--line)', color: 'var(--text-sub)', background: 'var(--tool-bg)' }}
            >
              <Upload size={12} /> Import
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </div>

          {/* Reset */}
          <button
            onClick={resetToDefaults}
            className="py-2 rounded-xl text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:outline-none"
            style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', background: 'rgba(248,113,113,0.05)' }}
          >
            Reset All to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 14.4: Run test to verify it passes**

```bash
cd /root/arona-webui && npm test -- --run src/components/settings/__tests__/SettingsModal.test.tsx 2>&1 | tail -20
```

Expected: 7 tests pass.

- [ ] **Step 14.5: Commit**

```bash
git add src/components/settings/SettingsModal.tsx src/components/settings/__tests__/SettingsModal.test.tsx
git commit -m "feat: SettingsModal — Background section, maxTokens, glass style, Theme label"
```

---

## Task 15: Wire up App.tsx, remove ActionsPanel + TopStatusBar

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/panels/ActionsPanel.tsx`
- Delete: `src/components/panels/__tests__/ActionsPanel.test.tsx`
- Delete: `src/components/layout/TopStatusBar.tsx`

- [ ] **Step 15.1: Replace `src/App.tsx`**

```tsx
import { useEffect } from 'react';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatFrame } from './components/chat/ChatFrame';
import { HistoryPanel } from './components/panels/HistoryPanel';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSessionStore } from './stores/sessionStore';
import { useUIStore } from './stores/uiStore';

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
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  return (
    <ThemeProvider>
      <DesktopLayout
        history={<HistoryPanel />}
        chat={<ChatFrame />}
      />
      <MobileLayout
        chat={<ChatFrame />}
        history={<HistoryPanel />}
        settings={<MobileSettingsShortcut />}
      />
      <SettingsModal />
    </ThemeProvider>
  );
}

export default App;
```

- [ ] **Step 15.2: Delete removed files**

```bash
rm /root/arona-webui/src/components/panels/ActionsPanel.tsx
rm /root/arona-webui/src/components/panels/__tests__/ActionsPanel.test.tsx
rm /root/arona-webui/src/components/layout/TopStatusBar.tsx
```

- [ ] **Step 15.3: Run full test suite**

```bash
cd /root/arona-webui && npm test -- --run 2>&1 | tail -40
```

Expected: all tests pass. Fix any remaining failures before proceeding.

- [ ] **Step 15.4: Run type-check**

```bash
cd /root/arona-webui && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 15.5: Start dev server and verify visually**

```bash
cd /root/arona-webui && npm run dev &
sleep 3 && echo "Dev server started"
```

Open `http://localhost:5173` in browser. Verify:
- Arona Light theme (light blue gradient background)
- Left: glass history panel with "New Chat"
- Center: glass chat panel with "Arona" header
- Bottom-right: FAB button (☰)
- Click FAB → sub-buttons expand (Settings, Export, Clear, Stop)
- Click Settings → glass modal with Theme / Background / maxTokens
- Send a message → user bubble (gradient blue), AI bubble (glass white)
- Kill dev server after verification.

- [ ] **Step 15.6: Commit**

```bash
git add src/App.tsx
git rm src/components/panels/ActionsPanel.tsx \
       src/components/panels/__tests__/ActionsPanel.test.tsx \
       src/components/layout/TopStatusBar.tsx
git commit -m "feat: wire up v4 App — remove TopStatusBar and ActionsPanel, use ChatFrame"
```

---

## Final Verification

- [ ] **Run full test suite one last time**

```bash
cd /root/arona-webui && npm test -- --run 2>&1 | tail -20
```

Expected: all tests pass, 0 failures.

- [ ] **Build check**

```bash
cd /root/arona-webui && npm run build 2>&1 | tail -20
```

Expected: `dist/` created, no TypeScript or build errors.
