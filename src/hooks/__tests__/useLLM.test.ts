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
    useSessionStore.setState({ sessions: [], currentSessionId: null, isStreaming: false });
    useSettingsStore.getState().resetToDefaults();
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
      expect(session?.messages[1].content).toBe('Hello!');
    });
  });

  it('handles HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    const sessionId = useSessionStore.getState().createSession();
    const { result } = renderHook(() => useLLM());

    await act(async () => {
      await result.current.sendMessage(sessionId, 'hi');
    });

    await waitFor(() => {
      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
      expect(session?.messages[1].status).toBe('error');
      expect(session?.messages[1].content).toContain('Unauthorized');
    });
  });

  it('stops streaming', async () => {
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise(() => {
        options?.signal?.addEventListener('abort', () => {
          // never resolve
        });
      });
    });

    const sessionId = useSessionStore.getState().createSession();
    const { result } = renderHook(() => useLLM());

    act(() => {
      result.current.sendMessage(sessionId, 'hi');
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
});
