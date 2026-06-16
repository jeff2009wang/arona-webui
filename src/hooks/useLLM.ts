import { useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { streamChatCompletion } from '../lib/llm';
import { streamHermesRunCompletion, isHermesBackend } from '../lib/hermes';
import { extractErrorMessage } from '../lib/error';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import type { Message, ToolCall } from '../types';

function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

export function useLLM() {
  const settings = useSettingsStore(
    useShallow((state) => ({
      baseUrl: state.baseUrl,
      apiKey: state.apiKey,
      model: state.model,
      temperature: state.temperature,
      maxTokens: state.maxTokens,
      systemPrompt: state.systemPrompt,
      persona: state.persona,
      enableCgBackground: state.enableCgBackground,
      backgroundOpacity: state.backgroundOpacity,
      backgroundBlur: state.backgroundBlur,
      autoSummarize: state.autoSummarize,
    }))
  );
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateMessage = useSessionStore((s) => s.updateMessage);
  const setStreaming = useSessionStore((s) => s.setStreaming);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const streamingToolsRef = useRef<
    Record<
      string,
      {
        id: string;
        name: string;
        arguments: string;
        status: ToolCall['status'];
        startedAt: number;
        finishedAt?: number;
      }
    >
  >({});
  const toolMessageIdRef = useRef<string | null>(null);
  const contentFlushRafRef = useRef<number | null>(null);

  const buildToolCalls = (): ToolCall[] => {
    return Object.values(streamingToolsRef.current).map((tc) => {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = tc.arguments ? JSON.parse(tc.arguments) : {};
      } catch {
        parsedArgs = {};
      }
      return {
        id: tc.id,
        name: tc.name || 'unknown',
        arguments: parsedArgs,
        status: tc.status,
        startedAt: tc.startedAt,
        finishedAt: tc.finishedAt,
      };
    });
  };

  const sendMessage = useCallback(
    async (content: string, images?: string[]) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      streamingToolsRef.current = {};
      toolMessageIdRef.current = null;

      const session = useSessionStore.getState().currentSession;
      if (!session) return;

      const userMessage: Message = {
        id: generateMessageId(),
        role: 'user',
        content,
        images: images?.length ? images : undefined,
        createdAt: Date.now(),
      };

      addMessage(userMessage);

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      addMessage(assistantMessage);
      setStreaming(true);

      const contentRef = { current: '' };
      const reasoningRef = { current: '' };
      const pendingContentRef = { current: '' };
      const pendingReasoningRef = { current: '' };

      const flushContentUpdate = () => {
        if (contentFlushRafRef.current) {
          cancelAnimationFrame(contentFlushRafRef.current);
          contentFlushRafRef.current = null;
        }
        const updates: Partial<Message> = {};
        if (contentRef.current !== pendingContentRef.current) {
          updates.content = contentRef.current;
          pendingContentRef.current = contentRef.current;
        }
        if (reasoningRef.current !== pendingReasoningRef.current) {
          updates.reasoning = reasoningRef.current;
          pendingReasoningRef.current = reasoningRef.current;
        }
        if (Object.keys(updates).length > 0) {
          updateMessage(assistantMessage.id, updates);
        }
      };

      const scheduleContentFlush = () => {
        if (contentFlushRafRef.current) return;
        contentFlushRafRef.current = requestAnimationFrame(() => {
          contentFlushRafRef.current = null;
          flushContentUpdate();
        });
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let streamErrored = false;
      activeRunIdRef.current = null;

      const syncToolMessage = () => {
        const toolCalls = buildToolCalls();
        if (toolCalls.length === 0) return;
        if (toolMessageIdRef.current) {
          updateMessage(toolMessageIdRef.current, { toolCalls });
        } else {
          const toolMessage: Message = {
            id: generateMessageId(),
            role: 'tool',
            content: '',
            createdAt: Date.now(),
            toolCalls,
          };
          toolMessageIdRef.current = toolMessage.id;
          addMessage(toolMessage);
        }
      };

      try {
        const currentMessages = useSessionStore.getState().currentSession?.messages ?? [];
        const streamMessages = currentMessages.filter(
          (m) =>
            (m.role === 'user' || m.role === 'assistant' || m.role === 'tool') &&
            m.status !== 'error' &&
            (m.role !== 'assistant' || m.content.trim() !== '')
        );

        if (isHermesBackend(settings)) {
          await streamHermesRunCompletion({
            settings,
            messages: streamMessages,
            sessionId: session.id,
            onChunk: (chunk) => {
              contentRef.current += chunk;
              scheduleContentFlush();
            },
            onReasoningChunk: (chunk) => {
              const normalizedChunk = chunk.trim();
              const normalizedContent = contentRef.current.trim();
              if (
                normalizedChunk &&
                !normalizedContent.startsWith(normalizedChunk)
              ) {
                reasoningRef.current = chunk;
                scheduleContentFlush();
              }
            },
            onToolCall: (toolCall) => {
              streamingToolsRef.current[toolCall.id] = {
                id: toolCall.id,
                name: toolCall.name,
                arguments: toolCall.arguments,
                status: toolCall.status,
                startedAt: streamingToolsRef.current[toolCall.id]?.startedAt ?? Date.now(),
                finishedAt: toolCall.status !== 'running' ? Date.now() : undefined,
              };
              syncToolMessage();
            },
            onRunId: (runId) => {
              activeRunIdRef.current = runId;
            },
            signal: controller.signal,
          });
        } else {
          await streamChatCompletion({
            settings,
            messages: streamMessages,
            onChunk: (chunk) => {
              contentRef.current += chunk;
              scheduleContentFlush();
            },
            onReasoningChunk: (chunk) => {
              reasoningRef.current += chunk;
              scheduleContentFlush();
            },
            onToolCall: (delta) => {
              const existing = streamingToolsRef.current[delta.id];
              if (existing) {
                existing.name = delta.name || existing.name;
                existing.arguments += delta.arguments;
              } else {
                streamingToolsRef.current[delta.id] = {
                  id: delta.id,
                  name: delta.name,
                  arguments: delta.arguments,
                  status: 'running',
                  startedAt: Date.now(),
                };
              }
              syncToolMessage();
            },
            signal: controller.signal,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User stopped — keep current content
        } else {
          streamErrored = true;
          const message = extractErrorMessage(error);
          console.error('[useLLM] stream error:', error);
          if (contentFlushRafRef.current) {
            cancelAnimationFrame(contentFlushRafRef.current);
            contentFlushRafRef.current = null;
          }
          contentRef.current = message;
          pendingContentRef.current = message;
          updateMessage(assistantMessage.id, {
            content: message,
            status: 'error',
          });
        }
      } finally {
        flushContentUpdate();
        if (toolMessageIdRef.current) {
          const finalStatus: ToolCall['status'] = streamErrored ? 'error' : 'success';
          for (const tc of Object.values(streamingToolsRef.current)) {
            tc.status = finalStatus;
            tc.finishedAt = Date.now();
          }
          updateMessage(toolMessageIdRef.current, {
            toolCalls: buildToolCalls(),
          });
        }
        streamingToolsRef.current = {};
        toolMessageIdRef.current = null;
        activeRunIdRef.current = null;

        if (abortControllerRef.current === controller) {
          setStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [settings, addMessage, updateMessage, setStreaming]
  );

  const stop = useCallback(() => {
    const current = abortControllerRef.current;
    const runId = activeRunIdRef.current;
    if (current) {
      current.abort();
      if (abortControllerRef.current === current) {
        abortControllerRef.current = null;
        setStreaming(false);
      }
    }
    if (runId) {
      activeRunIdRef.current = null;
      fetch(`${settings.baseUrl.replace(/\/+$/, '')}/runs/${runId}/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
        },
      }).catch(() => {});
    }
  }, [setStreaming, settings.baseUrl, settings.apiKey]);

  return { sendMessage, stop };
}
