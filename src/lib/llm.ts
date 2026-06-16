import type { Message, Settings, MessageNode, TextNode, ReasoningNode, ToolCallNode } from '../types';

export interface LLMOptions {
  settings: Settings;
  messages: Message[];
  onChunk?: (chunk: string) => void;
  onReasoningChunk?: (chunk: string) => void;
  onToolCall?: (toolCall: { id: string; name: string; arguments: string }) => void;
  onNodeUpdate?: (node: MessageNode) => void;
  signal?: AbortSignal;
}

export class LLMError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'LLMError';
  }
}

function nodesToApiString(nodes: MessageNode[]): string {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') out += n.content;
    else if (n.type === 'reasoning') out += n.content;
  }
  return out;
}

export async function streamChatCompletion({
  settings,
  messages,
  onChunk,
  onReasoningChunk,
  onToolCall,
  onNodeUpdate,
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
                  { type: 'text', text: Array.isArray(m.content) ? nodesToApiString(m.content) : m.content },
                  ...m.images.map((url) => ({
                    type: 'image_url',
                    image_url: { url, detail: 'auto' },
                  })),
                ]
              : Array.isArray(m.content)
                ? nodesToApiString(m.content)
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
  const partialToolCalls = new Map<number, { id: string; name: string; args: string; startedAt: number }>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        processSSELine(line, onChunk, onReasoningChunk, onToolCall, onNodeUpdate, partialToolCalls);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      processSSELine(buffer, onChunk, onReasoningChunk, onToolCall, onNodeUpdate, partialToolCalls);
    }
  } finally {
    reader.releaseLock();
  }
}

function processSSELine(
  line: string,
  onChunk?: (chunk: string) => void,
  onReasoningChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: { id: string; name: string; arguments: string }) => void,
  onNodeUpdate?: (node: MessageNode) => void,
  partialToolCalls?: Map<number, { id: string; name: string; args: string; startedAt: number }>
) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data:')) return;

  const data = trimmed.slice(5).trim();
  if (data === '[DONE]') return;

  try {
    const parsed = JSON.parse(data);
    const delta = parsed.choices?.[0]?.delta;
    if (delta?.content) {
      onChunk?.(delta.content);
      onNodeUpdate?.({ type: 'text', content: delta.content } as TextNode);
    }
    if (delta?.reasoning_content) {
      onReasoningChunk?.(delta.reasoning_content);
      onNodeUpdate?.({ type: 'reasoning', content: delta.reasoning_content } as ReasoningNode);
    }
    if (delta?.reasoning) {
      onReasoningChunk?.(delta.reasoning);
      onNodeUpdate?.({ type: 'reasoning', content: delta.reasoning } as ReasoningNode);
    }
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const index = tc.index ?? 0;
        const id = tc.id ?? partialToolCalls?.get(index)?.id ?? 'unknown';
        const name = tc.function?.name ?? partialToolCalls?.get(index)?.name ?? '';
        const argsDelta = tc.function?.arguments ?? '';

        let existing = partialToolCalls?.get(index);
        if (!existing) {
          existing = { id, name, args: '', startedAt: Date.now() };
          partialToolCalls?.set(index, existing);
        }
        if (argsDelta) {
          existing.args += argsDelta;
        }
        if (tc.function?.name) {
          existing.name = tc.function.name;
        }
        if (tc.id) {
          existing.id = tc.id;
        }

        if (name || argsDelta) {
          onToolCall?.({ id: existing.id, name: existing.name, arguments: existing.args });
        }

        let parsedArgs: Record<string, unknown> = {};
        try {
          if (existing.args.trim()) {
            parsedArgs = JSON.parse(existing.args);
          }
        } catch {
          // Partial JSON: send empty object so useLLM keeps previous parsed args
        }

        onNodeUpdate?.({
          type: 'tool_call',
          id: existing.id,
          name: existing.name,
          arguments: parsedArgs,
          status: 'running',
          startedAt: existing.startedAt,
        } as ToolCallNode);
      }
    }
  } catch {
    // Ignore malformed lines
  }
}
