import { useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { streamChatCompletion } from '../lib/llm';
import { streamHermesRunCompletion, isHermesBackend } from '../lib/hermes';
import { extractErrorMessage } from '../lib/error';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import type { Message, MessageNode, TextNode, ReasoningNode, ToolCallNode } from '../types';

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
  const contentFlushRafRef = useRef<number | null>(null);

  const sendMessage = useCallback(
    async (content: string, images?: string[]) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

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
        content: [] as MessageNode[],
        createdAt: Date.now(),
      };

      addMessage(assistantMessage);
      setStreaming(true);

      const nodesRef = { current: [] as MessageNode[] };
      const pendingNodesRef = { current: [] as MessageNode[] };

      const flushContentUpdate = () => {
        if (contentFlushRafRef.current) {
          cancelAnimationFrame(contentFlushRafRef.current);
          contentFlushRafRef.current = null;
        }
        if (nodesRef.current !== pendingNodesRef.current) {
          updateMessage(assistantMessage.id, { content: nodesRef.current });
          pendingNodesRef.current = nodesRef.current;
        }
      };

      const scheduleContentFlush = () => {
        if (contentFlushRafRef.current) return;
        contentFlushRafRef.current = requestAnimationFrame(() => {
          contentFlushRafRef.current = null;
          flushContentUpdate();
        });
      };

      const handleNodeUpdate = (node: MessageNode, isHermes = false) => {
        const nodes = nodesRef.current;
        if (node.type === 'text') {
          const last = nodes[nodes.length - 1];
          if (last && last.type === 'text') {
            (last as TextNode).content += (node as TextNode).content;
          } else {
            nodes.push({ type: 'text', content: (node as TextNode).content });
          }
        } else if (node.type === 'reasoning') {
          const last = nodes[nodes.length - 1];
          const newContent = (node as ReasoningNode).content;
          if (isHermes) {
            // Hermes sends full reasoning text on each reasoning.available event.
            // Replace the last reasoning node, and skip if it's just a prefix of the text content.
            const textContent = nodes
              .filter((n) => n.type === 'text')
              .map((n) => (n as TextNode).content)
              .join('');
            if (newContent.trim() && !textContent.trim().startsWith(newContent.trim())) {
              if (last && last.type === 'reasoning') {
                (last as ReasoningNode).content = newContent;
              } else {
                nodes.push({ type: 'reasoning', content: newContent });
              }
            }
          } else {
            // OpenAI reasoning deltas: append
            if (last && last.type === 'reasoning') {
              (last as ReasoningNode).content += newContent;
            } else {
              nodes.push({ type: 'reasoning', content: newContent });
            }
          }
        } else if (node.type === 'tool_call') {
          const tc = node as ToolCallNode;
          const existingIndex = nodes.findIndex((n) => n.type === 'tool_call' && (n as ToolCallNode).id === tc.id);
          if (existingIndex >= 0) {
            const existing = nodes[existingIndex] as ToolCallNode;
            nodes[existingIndex] = {
              ...existing,
              ...tc,
              arguments: tc.arguments && Object.keys(tc.arguments).length > 0 ? tc.arguments : existing.arguments,
              startedAt: existing.startedAt,
            };
          } else {
            nodes.push({ ...tc });
          }
        }
        scheduleContentFlush();
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;

      activeRunIdRef.current = null;

      try {
        const currentMessages = useSessionStore.getState().currentSession?.messages ?? [];
        const streamMessages = currentMessages.filter(
          (m) =>
            (m.role === 'user' || m.role === 'assistant' || m.role === 'tool') &&
            m.status !== 'error' &&
            (m.role !== 'assistant' || (Array.isArray(m.content) ? m.content.length > 0 : m.content.trim() !== ''))
        );

        if (isHermesBackend(settings)) {
          await streamHermesRunCompletion({
            settings,
            messages: streamMessages,
            sessionId: session.id,
            onNodeUpdate: (node) => handleNodeUpdate(node, true),
            onRunId: (runId) => {
              activeRunIdRef.current = runId;
            },
            signal: controller.signal,
          });
        } else {
          await streamChatCompletion({
            settings,
            messages: streamMessages,
            onNodeUpdate: (node) => handleNodeUpdate(node, false),
            signal: controller.signal,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User stopped — keep current content
        } else {
          const message = extractErrorMessage(error);
          console.error('[useLLM] stream error:', error);
          if (contentFlushRafRef.current) {
            cancelAnimationFrame(contentFlushRafRef.current);
            contentFlushRafRef.current = null;
          }
          nodesRef.current = [{ type: 'text', content: message }];
          pendingNodesRef.current = nodesRef.current;
          updateMessage(assistantMessage.id, {
            content: nodesRef.current,
            status: 'error',
          });
        }
      } finally {
        flushContentUpdate();
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
