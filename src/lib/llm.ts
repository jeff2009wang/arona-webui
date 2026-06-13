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
