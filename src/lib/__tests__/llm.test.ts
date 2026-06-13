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
