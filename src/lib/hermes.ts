import { LLMError } from './llm';
import type { Message, Settings, MessageNode, TextNode, ReasoningNode, ToolCallNode } from '../types';

export interface HermesRunOptions {
  settings: Settings;
  messages: Message[];
  sessionId?: string;
  onChunk?: (chunk: string) => void;
  onReasoningChunk?: (chunk: string) => void;
  onToolCall?: (toolCall: {
    id: string;
    name: string;
    arguments: string;
    status: 'running' | 'success' | 'error';
  }) => void;
  onNodeUpdate?: (node: MessageNode) => void;
  onRunId?: (runId: string) => void;
  signal?: AbortSignal;
}

interface HermesEvent {
  event: string;
  run_id?: string;
  delta?: string;
  text?: string;
  tool?: string;
  preview?: string;
  args?: Record<string, unknown>;
  error?: string;
  message?: string;
  completed?: boolean;
  failed?: boolean;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function nodesToApiString(nodes: MessageNode[]): string {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') out += n.content;
    else if (n.type === 'reasoning') out += n.content;
  }
  return out;
}

function buildHistory(messages: Message[]): { role: string; content: string }[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: Array.isArray(m.content) ? nodesToApiString(m.content) : m.content,
    }));
}

async function postRun(
  baseUrl: string,
  apiKey: string,
  input: string,
  instructions: string,
  history: { role: string; content: string }[],
  sessionId: string | undefined,
  signal?: AbortSignal
): Promise<{ run_id: string }> {
  const response = await fetch(`${baseUrl}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input,
      instructions,
      conversation_history: history,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new LLMError(text || `HTTP ${response.status}`, response.status);
  }

  const data = (await response.json()) as { run_id?: string };
  if (!data.run_id) {
    throw new LLMError('No run_id returned from Hermes /v1/runs');
  }
  return { run_id: data.run_id };
}

async function denyApproval(baseUrl: string, apiKey: string, runId: string) {
  try {
    await fetch(`${baseUrl}/runs/${runId}/approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ choice: 'deny' }),
    });
  } catch {
    // Best-effort: if the run has already finished, this may 409; ignore.
  }
}

async function readEvents(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handlers: {
    onEvent: (event: HermesEvent) => void;
    onError?: (error: Error) => void;
  },
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  const flushBlock = (block: string) => {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith(':')) return;
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data) return;
    let event: HermesEvent;
    try {
      event = JSON.parse(data) as HermesEvent;
    } catch {
      return;
    }
    handlers.onEvent(event);
  };

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        flushBlock(block);
      }
    }

    buffer += decoder.decode();
    const blocks = buffer.split('\n\n');
    for (const block of blocks) {
      flushBlock(block);
    }
  } catch (error) {
    if (error instanceof Error) {
      handlers.onError?.(error);
    }
    throw error;
  }
}

export async function streamHermesRunCompletion({
  settings,
  messages,
  sessionId,
  onChunk,
  onReasoningChunk,
  onToolCall,
  onNodeUpdate,
  onRunId,
  signal,
}: HermesRunOptions): Promise<void> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const apiKey = settings.apiKey;

  const historyMessages = buildHistory(messages);
  const lastUser = [...historyMessages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    throw new LLMError('No user message found in conversation');
  }
  const input = lastUser.content;
  const conversationHistory = historyMessages.slice(0, historyMessages.indexOf(lastUser));

  const { run_id: runId } = await postRun(
    baseUrl,
    apiKey,
    input,
    settings.systemPrompt,
    conversationHistory,
    sessionId,
    signal
  );
  onRunId?.(runId);

  const response = await fetch(`${baseUrl}/runs/${runId}/events`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new LLMError(text || `HTTP ${response.status}`, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new LLMError('No response body for Hermes run events');

  let completed = false;
  const runningToolIds = new Map<string, string>();
  let toolCounter = 0;

  await readEvents(
    reader,
    {
      onEvent: (event) => {
        switch (event.event) {
          case 'message.delta': {
            if (event.delta) {
              onChunk?.(event.delta);
              onNodeUpdate?.({ type: 'text', content: event.delta } as TextNode);
            }
            break;
          }
          case 'reasoning.available': {
            if (event.text) {
              onReasoningChunk?.(event.text);
              onNodeUpdate?.({ type: 'reasoning', content: event.text } as ReasoningNode);
            }
            break;
          }
          case 'tool.started': {
            const name = event.tool || 'unknown';
            toolCounter += 1;
            const id = `hermes-tool-${toolCounter}`;
            runningToolIds.set(name, id);
            const args: Record<string, unknown> = {};
            if (event.preview) {
              try {
                const parsed = JSON.parse(event.preview);
                if (parsed && typeof parsed === 'object') Object.assign(args, parsed);
              } catch {
                args.preview = event.preview;
              }
            }
            if (event.args && typeof event.args === 'object') {
              Object.assign(args, event.args);
            }
            onToolCall?.({ id, name, arguments: JSON.stringify(args), status: 'running' });
            onNodeUpdate?.({
              type: 'tool_call',
              id,
              name,
              arguments: args,
              status: 'running',
              startedAt: Date.now(),
            } as ToolCallNode);
            break;
          }
          case 'tool.completed': {
            const name = event.tool || 'unknown';
            const id = runningToolIds.get(name) || `hermes-tool-${toolCounter}`;
            runningToolIds.delete(name);
            const status = event.error ? 'error' : 'success';
            onToolCall?.({
              id,
              name,
              arguments: JSON.stringify({ preview: event.preview || '' }),
              status,
            });
            onNodeUpdate?.({
              type: 'tool_call',
              id,
              name,
              arguments: {},
              status,
              startedAt: Date.now(),
              finishedAt: Date.now(),
            } as ToolCallNode);
            break;
          }
          case 'approval.request':
            void denyApproval(baseUrl, apiKey, runId);
            break;
          case 'run.completed':
            completed = true;
            break;
          case 'run.failed':
          case 'error':
            throw new LLMError(event.error || event.message || 'Hermes run failed');
        }
      },
    },
    signal
  );

  if (!completed) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Hermes] run events stream closed without run.completed');
    }
  }
}

export function isHermesBackend(settings: Settings): boolean {
  if (settings.model === 'hermes-agent') return true;
  try {
    return settings.baseUrl.includes(':8642');
  } catch {
    return false;
  }
}
