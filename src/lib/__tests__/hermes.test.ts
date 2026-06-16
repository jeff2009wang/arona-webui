import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamHermesRunCompletion, isHermesBackend } from '../hermes';
import type { Settings } from '../../types';

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

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    baseUrl: 'http://127.0.0.1:8642/v1',
    apiKey: 'test-key',
    model: 'hermes-agent',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful assistant.',
    persona: 'arona',
    enableCgBackground: true,
    backgroundOpacity: 0.75,
    backgroundBlur: 0,
    streamEnabled: true,
    localBackgroundPath: '',
    localAvatarPath: '',
    ...overrides,
  };
}

describe('isHermesBackend', () => {
  it('returns true for hermes-agent model', () => {
    expect(isHermesBackend(makeSettings({ model: 'hermes-agent' }))).toBe(true);
  });

  it('returns true when baseUrl contains :8642', () => {
    expect(isHermesBackend(makeSettings({ model: 'gpt-4o-mini' }))).toBe(true);
  });

  it('returns false for a generic OpenAI endpoint', () => {
    expect(
      isHermesBackend(
        makeSettings({ baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' })
      )
    ).toBe(false);
  });
});

describe('streamHermesRunCompletion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts a run and streams content chunks', async () => {
    const fetchMock = vi
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
              'data: {"event":"message.delta","delta":"!"}\n\n',
              'data: {"event":"run.completed"}\n\n',
              ': stream closed\n\n',
            ]),
        },
      });
    global.fetch = fetchMock;

    const chunks: string[] = [];
    const reasoningChunks: string[] = [];
    const runIds: string[] = [];

    await streamHermesRunCompletion({
      settings: makeSettings(),
      messages: [
        { id: '1', role: 'user', content: 'hi', createdAt: Date.now() },
      ],
      onChunk: (chunk) => chunks.push(chunk),
      onReasoningChunk: (chunk) => reasoningChunks.push(chunk),
      onRunId: (runId) => runIds.push(runId),
    });

    expect(runIds).toEqual(['run_123']);
    expect(chunks).toEqual(['Hello', '!']);
    expect(reasoningChunks).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:8642/v1/runs');
    expect(fetchMock.mock.calls[1][0]).toBe('http://127.0.0.1:8642/v1/runs/run_123/events');
  });

  it('streams reasoning.available chunks separately', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_456' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"reasoning.available","text":"Let me think."}\n\n',
              'data: {"event":"message.delta","delta":"Done"}\n\n',
              'data: {"event":"run.completed"}\n\n',
            ]),
        },
      });

    const chunks: string[] = [];
    const reasoningChunks: string[] = [];

    await streamHermesRunCompletion({
      settings: makeSettings(),
      messages: [
        { id: '1', role: 'user', content: 'solve', createdAt: Date.now() },
      ],
      onChunk: (chunk) => chunks.push(chunk),
      onReasoningChunk: (chunk) => reasoningChunks.push(chunk),
    });

    expect(chunks).toEqual(['Done']);
    expect(reasoningChunks).toEqual(['Let me think.']);
  });

  it('exits early when aborted during the events stream', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_789' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"message.delta","delta":"working"}\n\n',
              'data: {"event":"message.delta","delta":"..."}\n\n',
            ]),
        },
      });
    global.fetch = fetchMock;

    const controller = new AbortController();

    const chunks: string[] = [];
    await streamHermesRunCompletion({
      settings: makeSettings(),
      messages: [
        { id: '1', role: 'user', content: 'hi', createdAt: Date.now() },
      ],
      onChunk: (chunk) => {
        chunks.push(chunk);
        if (chunks.length === 1) controller.abort();
      },
      signal: controller.signal,
    });

    expect(chunks).toEqual(['working']);
  });

  it('throws LLMError when run creation fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(
      streamHermesRunCompletion({
        settings: makeSettings(),
        messages: [
          { id: '1', role: 'user', content: 'hi', createdAt: Date.now() },
        ],
        onChunk: () => {},
      })
    ).rejects.toThrow('Internal Server Error');
  });

  it('throws LLMError when run events report a failure', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_fail' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"message.delta","delta":"Hello"}\n\n',
              'data: {"event":"run.failed","error":"Run was cancelled"}\n\n',
            ]),
        },
      });

    await expect(
      streamHermesRunCompletion({
        settings: makeSettings(),
        messages: [{ id: '1', role: 'user', content: 'hi', createdAt: Date.now() }],
        onChunk: () => {},
      })
    ).rejects.toThrow('Run was cancelled');
  });

  it('emits tool.started and tool.completed events', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_tools' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"tool.started","tool":"web_search","preview":"{\\"query\\":\\"test\\"}"}\n\n',
              'data: {"event":"message.delta","delta":"Found"}\n\n',
              'data: {"event":"tool.completed","tool":"web_search","duration":1.23,"error":false}\n\n',
              'data: {"event":"run.completed"}\n\n',
            ]),
        },
      });

    const toolCalls: Array<{
      id: string;
      name: string;
      arguments: string;
      status: 'running' | 'success' | 'error';
    }> = [];

    await streamHermesRunCompletion({
      settings: makeSettings(),
      messages: [{ id: '1', role: 'user', content: 'hi', createdAt: Date.now() }],
      onChunk: () => {},
      onToolCall: (tc) => toolCalls.push(tc),
    });

    expect(toolCalls).toHaveLength(2);
    expect(toolCalls[0].name).toBe('web_search');
    expect(toolCalls[0].status).toBe('running');
    expect(toolCalls[1].status).toBe('success');
  });

  it('auto-denies approval requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ run_id: 'run_approval' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () =>
            createMockReader([
              'data: {"event":"approval.request"}\n\n',
              'data: {"event":"run.completed"}\n\n',
            ]),
        },
      })
      .mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    await streamHermesRunCompletion({
      settings: makeSettings(),
      messages: [
        { id: '1', role: 'user', content: 'hi', createdAt: Date.now() },
      ],
      onChunk: () => {},
    });

    const approvalCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).endsWith('/approval')
    );
    expect(approvalCall).toBeDefined();
    expect(approvalCall![1].body).toContain('deny');
  });

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
});
