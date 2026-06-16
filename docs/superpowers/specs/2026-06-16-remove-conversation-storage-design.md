# Remove Conversation Storage System — Design Spec

> **Date:** 2026-06-16  
> **Goal:** Remove the client-side conversation storage system because the project connects to HermesAgent, which manages conversation state; keep only a single, ephemeral in-memory chat.

---

## Background

The current frontend persists a list of chat sessions to `localStorage` via `sessionStore` and exposes a full session manager (HistoryPanel, import/export, new session, rename, delete, auto-generated titles). Since the backend is now HermesAgent, the client no longer needs to maintain multiple sessions or persist conversation history. The client only needs:

1. A single, in-memory conversation for the current page session.
2. A way for the user to clear that conversation and start fresh.
3. Continued persistence of **settings** (API endpoint, model, persona, background, etc.).

---

## Requirements

1. **No persistence for conversations.** `sessionStore` must not write to `localStorage`.
2. **Single conversation only.** Remove the `sessions` array and all multi-session UI.
3. **Clear current conversation.** Users can clear the current chat from the FABDrawer; this generates a new `session.id` so HermesAgent treats it as a new conversation.
4. **Remove session management UI.** Delete `HistoryPanel`, import/export buttons, and session-related actions from `SettingsModal` and `FABDrawer`.
5. **Layout change.** Desktop layout becomes single-column (chat occupies the full layout). Mobile layout removes the history tab.
6. **Settings persistence remains.** `settingsStore` continues to use `localStorage`.
7. **Hermes integration unchanged in shape.** `src/lib/hermes.ts` still sends `session_id` (from the current in-memory session) and `conversation_history` (from the current in-memory messages).
8. **Title/summary generation stopped.** `sessionMeta.ts` is kept for future use but `useLLM` no longer auto-generates titles or summaries.

---

## Architecture

```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  ChatFrame  /  ChatComposer  / FABDrawer │
│  SettingsModal (no import/export)        │
└─────────────┬───────────────────────────┘
              │ currentSession (memory only)
┌─────────────▼───────────────────────────┐
│           sessionStore                  │
│  currentSession: Session | null         │
│  addMessage / updateMessage / clearChat │
│  setStreaming                           │
└─────────────┬───────────────────────────┘
              │ messages + session.id
┌─────────────▼───────────────────────────┐
│           useLLM                        │
│  sendMessage(content, images?)          │
│  stop()                                 │
└─────────────┬───────────────────────────┘
              │ input + history + session_id
┌─────────────▼───────────────────────────┐
│         src/lib/hermes.ts               │
│  POST /runs                             │
│  SSE /runs/{run_id}/events              │
└─────────────────────────────────────────┘
```

---

## Data Model

Keep the existing `Session` and `Message` types but use only one session at a time.

```ts
// types/index.ts — no changes
export interface Session {
  id: string;
  title: string;
  summary: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  titleGenerated: boolean;
  summaryGenerated: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  reasoning?: string;
  createdAt: number;
  toolCalls?: ToolCall[];
  status?: 'sending' | 'sent' | 'error';
  images?: string[];
}
```

`sessionStore` state becomes:

```ts
interface SessionState {
  currentSession: Session | null;
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearChat: () => void;
  setStreaming: (value: boolean) => void;
}
```

---

## File-by-File Changes

### `src/stores/sessionStore.ts`

- Remove `persist` import and wrapper.
- Remove `localStorageAdapter` import.
- Replace `sessions: Session[]` and `currentSessionId: string | null` with `currentSession: Session | null`.
- Remove methods:
  - `createSession`
  - `selectSession`
  - `renameSession`
  - `deleteSession`
  - `updateSessionMeta`
  - `regenerateSessionMeta`
  - `exportSessions`
  - `importSessions`
  - `exportToFile`
  - `importFromFile`
- Keep/adapt:
  - `addMessage`
  - `updateMessage`
  - `deleteMessage`
  - `clearChat` (replaces `clearSession`; creates a fresh empty session)
  - `setStreaming`
- On store initialization, create one empty session.

### `src/components/panels/HistoryPanel.tsx`

- Delete file.

### `src/components/panels/__tests__/HistoryPanel.test.tsx`

- Delete file.

### `src/components/layout/DesktopLayout.tsx`

- Change from two-column (`history` + `chat`) to single-column (`chat` only).

### `src/components/layout/MobileLayout.tsx`

- Remove the history tab; keep chat and settings tabs.

### `src/stores/uiStore.ts`

- Change `MobileTab` from `'chat' | 'history' | 'settings'` to `'chat' | 'settings'`.
- Remove `isHistoryOpen` and `toggleHistory` if no other component uses them.

### `src/App.tsx`

- Remove `HistoryPanel` import and usage.
- Remove the `useEffect` that auto-creates a session; initialization moves into `sessionStore`.
- Pass only `chat` to layout components.

### `src/hooks/useLLM.ts`

- Remove `sessionId` parameter from `sendMessage`; read the current session from the store.
- Remove `regenerateSessionMeta` call and dependency.
- Update `addMessage` / `updateMessage` calls to the new signatures.
- Keep Hermes session handling: send `useSessionStore.getState().currentSession?.id` as `sessionId`.

### `src/components/chat/ChatFrame.tsx`

- Read `currentSession` instead of deriving it from `sessions` and `currentSessionId`.
- Remove `createSession` usage; `EmptyChatState` no longer offers “新建会话”. Replace with a clear-chat prompt or remove the chip.
- Update scroll/grouping logic to use `currentSession.messages`.

### `src/components/chat/EmptyChatState.tsx`

- Remove `onNewSession` prop (or repurpose it to `onClearChat` if desired).
- Remove the “新建会话” quick-action chip.

### `src/components/chat/FABDrawer.tsx`

- Remove Export/Import sub-buttons.
- Keep Clear (calls `clearChat`) and Settings.
- Keep Stop while streaming.

### `src/components/settings/SettingsModal.tsx`

- Remove `exportToFile` and `importFromFile` usage.
- Remove Export Sessions / Import Sessions buttons and the hidden file input.
- Keep Reset to Defaults and Clear All Local Data (the latter still clears settings from localStorage).

### `src/lib/hermes.ts`

- No API shape changes.
- Document that `sessionId` is now the current ephemeral session id and changes when the user clears the chat.

### `src/lib/sessionMeta.ts`

- Keep file and exports.
- Stop calling from `useLLM`.

### `src/lib/storage.ts`

- Keep; still used by `settingsStore`.

---

## Testing Plan

1. **Unit: `src/stores/__tests__/sessionStore.test.ts`**
   - Initialize store creates a single empty session.
   - `addMessage` appends to `currentSession.messages`.
   - `updateMessage` updates by message id.
   - `clearChat` resets messages and changes `currentSession.id`.
   - No writes to `localStorage` occur.

2. **Unit: `src/hooks/__tests__/useLLM.test.ts`**
   - `sendMessage` adds user and assistant messages to the current session.
   - Stop/clear interactions work with the new store shape.

3. **Component: `src/components/chat/__tests__/FABDrawer.test.tsx`**
   - Clear button calls `clearChat`.
   - Export/Import buttons are removed.

4. **Component: `src/components/settings/__tests__/SettingsModal.test.tsx`**
   - Export/Import buttons are removed.
   - Reset and Clear All Local Data remain.

5. **Integration / lib: `src/lib/__tests__/hermes.test.ts`**
   - Hermes still sends `session_id` and `conversation_history`.

6. **Remove: `src/components/panels/__tests__/HistoryPanel.test.tsx`**
   - Delete.

---

## Open Questions / Decisions

| Topic | Decision |
|---|---|
| Settings persistence | Keep in `localStorage`. |
| Clear-chat button location | FABDrawer. |
| Desktop layout | Single column, chat full width. |
| Session type | Keep; use a single instance in memory. |
| Title/summary generation | Stop auto-generation; keep helper file. |
| Hermes `session_id` | Still send; regenerate on clear chat. |

---

## Success Criteria

- [ ] No `localStorage` key for sessions is written.
- [ ] `HistoryPanel` is removed.
- [ ] Import/export session buttons are removed.
- [ ] FABDrawer can clear the current chat.
- [ ] Chat still streams responses from HermesAgent.
- [ ] Settings are still persisted across reloads.
- [ ] All existing and updated tests pass.
