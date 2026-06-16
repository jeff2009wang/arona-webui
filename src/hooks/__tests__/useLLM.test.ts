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
