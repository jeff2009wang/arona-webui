import type { Message, Settings } from '../types';

export interface LLMOptions {
  settings: Settings;
  messages: Message[];
  onChunk: (chunk: string) => void;
  onReasoningChunk?: (chunk: string) => void;
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
  onReasoningChunk,
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
        })),
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new LLMError(text || `HTTP ${response.status}`, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new LLMError('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        processSSELine(line, onChunk, onReasoningChunk, onToolCall);
      }
    }

    // Flush any bytes the decoder held for an incomplete multi-byte sequence
    buffer += decoder.decode();
    if (buffer.trim()) {
      processSSELine(buffer, onChunk, onReasoningChunk, onToolCall);
    }
  } finally {
    reader.releaseLock();
  }
}

function processSSELine(
  line: string,
  onChunk: (chunk: string) => void,
  onReasoningChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: { id: string; name: string; arguments: string }) => void
) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data:')) return;

  const data = trimmed.slice(5).trim();
  if (data === '[DONE]') return;

  try {
    const parsed = JSON.parse(data);
    const delta = parsed.choices?.[0]?.delta;
    if (delta?.content) onChunk(delta.content);
    if (delta?.reasoning_content && onReasoningChunk) {
      onReasoningChunk(delta.reasoning_content);
    }
    if (delta?.reasoning && onReasoningChunk) {
      onReasoningChunk(delta.reasoning);
    }
    if (delta?.tool_calls && onToolCall) {
      for (const tc of delta.tool_calls) {
        const id = tc.id ?? 'unknown';
        const name = tc.function?.name ?? '';
        const args = tc.function?.arguments ?? '';
        if (name || args) {
          onToolCall({ id, name, arguments: args });
        }
      }
    }
  } catch {
    // Ignore malformed lines
  }
}
