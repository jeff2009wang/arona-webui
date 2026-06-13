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
          releaseLock: vi.fn(),
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
