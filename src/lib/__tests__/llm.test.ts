import { describe, it, expect, vi } from 'vitest';
import { streamChatCompletion, LLMError } from '../llm';

function createMockReader(data: string[]) {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    read: () => {
      if (i >= data.length) return Promise.resolve({ done: true, value: undefined });
      return Promise.resolve({ done: false, value: encoder.encode(data[i++]) });
    },
    releaseLock: vi.fn(),
  };
}

describe('streamChatCompletion', () => {
  const baseSettings = {
    baseUrl: 'http://test',
    apiKey: 'key',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '',
    persona: 'arona' as const,
    enableCgBackground: true,
    backgroundOpacity: 0.75,
    backgroundBlur: 0,
  };

  it('streams chunks', async () => {
    const chunks: string[] = [];
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

    await streamChatCompletion({
      settings: baseSettings,
      messages: [{ id: '1', role: 'user', content: 'hi', createdAt: Date.now() }],
      onChunk: (c) => chunks.push(c),
    });

    expect(chunks.join('')).toBe('Hello!');
  });

  it('handles trailing buffer without trailing newline', async () => {
    const chunks: string[] = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () =>
          createMockReader([
            'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":" world"}}]}',
          ]),
      },
    });

    await streamChatCompletion({
      settings: baseSettings,
      messages: [],
      onChunk: (c) => chunks.push(c),
    });

    expect(chunks.join('')).toBe('Hello world');
  });

  it('streams tool calls', async () => {
    const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () =>
          createMockReader([
            'data: {"choices":[{"delta":{"tool_calls":[{"id":"tc1","function":{"name":"search","arguments":"{}"}}]}}]}\n\n',
            'data: [DONE]\n\n',
          ]),
      },
    });

    await streamChatCompletion({
      settings: baseSettings,
      messages: [],
      onChunk: () => {},
      onToolCall: (tc) => toolCalls.push(tc),
    });

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].name).toBe('search');
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(
      streamChatCompletion({
        settings: { ...baseSettings, apiKey: '' },
        messages: [],
        onChunk: () => {},
      })
    ).rejects.toThrow(LLMError);
  });

  it('streams tool calls as nodes via onNodeUpdate', async () => {
    const nodes: import('../../types').MessageNode[] = [];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () =>
          createMockReader([
            'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"tc1","function":{"name":"search","arguments":""}}]}}]}\n\n',
            'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"q\\":\\"test\\"}"}}]}}]}\n\n',
            'data: [DONE]\n\n',
          ]),
      },
    });

    await streamChatCompletion({
      settings: baseSettings,
      messages: [],
      onChunk: () => {},
      onNodeUpdate: (n) => nodes.push(n),
    });

    const toolNodes = nodes.filter((n) => n.type === 'tool_call') as import('../../types').ToolCallNode[];
    expect(toolNodes.length).toBeGreaterThanOrEqual(1);
    expect(toolNodes[toolNodes.length - 1].name).toBe('search');
    expect(toolNodes[toolNodes.length - 1].arguments).toEqual({ q: 'test' });
    expect(toolNodes[toolNodes.length - 1].status).toBe('running');
  });

  it('converts assistant node arrays to string for API, including reasoning', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => createMockReader(['data: [DONE]\n\n']) },
    });
    global.fetch = fetchSpy;

    await streamChatCompletion({
      settings: baseSettings,
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: [
            { type: 'text', content: 'Hello ' },
            { type: 'reasoning', content: 'thinking...' },
            { type: 'text', content: 'world' },
          ],
          createdAt: Date.now(),
        },
      ],
      onChunk: () => {},
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.messages[1].content).toBe('Hello thinking...world');
  });

  it('passes abort signal to fetch', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => createMockReader(['data: [DONE]\n\n']) },
    });
    global.fetch = fetchSpy;

    const controller = new AbortController();
    await streamChatCompletion({
      settings: baseSettings,
      messages: [],
      onChunk: () => {},
      signal: controller.signal,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
