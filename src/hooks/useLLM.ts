import { useCallback, useRef } from 'react';
import { streamChatCompletion, LLMError } from '../lib/llm';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import type { Message } from '../types';

export function useLLM() {
  const settings = useSettingsStore();
  const { addMessage, updateMessage, setStreaming } = useSessionStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (sessionId: string, content: string) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: Date.now(),
      };

      addMessage(sessionId, userMessage);

      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      addMessage(sessionId, assistantMessage);
      setStreaming(true);

      abortControllerRef.current = new AbortController();

      try {
        await streamChatCompletion({
          settings,
          messages: session.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
          onChunk: (chunk) => {
            updateMessage(sessionId, assistantMessage.id, {
              content: assistantMessage.content + chunk,
            });
            assistantMessage.content += chunk;
          },
          signal: abortControllerRef.current.signal,
        });
      } catch (error) {
        updateMessage(sessionId, assistantMessage.id, {
          content: error instanceof LLMError ? error.message : 'Unknown error',
          status: 'error',
        });
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [settings, addMessage, updateMessage, setStreaming]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, stop };
}
