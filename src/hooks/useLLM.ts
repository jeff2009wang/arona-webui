import { useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { streamChatCompletion, LLMError } from '../lib/llm';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';
import type { Message } from '../types';

export function useLLM() {
  const settings = useSettingsStore(
    useShallow((state) => ({
      baseUrl: state.baseUrl,
      apiKey: state.apiKey,
      model: state.model,
      temperature: state.temperature,
      systemPrompt: state.systemPrompt,
      persona: state.persona,
    }))
  );
  const addMessage = useSessionStore((s) => s.addMessage);
  const updateMessage = useSessionStore((s) => s.updateMessage);
  const setStreaming = useSessionStore((s) => s.setStreaming);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (sessionId: string, content: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

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

      const contentRef = { current: '' };
      abortControllerRef.current = new AbortController();

      try {
        await streamChatCompletion({
          settings,
          messages: session.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
          onChunk: (chunk) => {
            contentRef.current += chunk;
            updateMessage(sessionId, assistantMessage.id, {
              content: contentRef.current,
            });
          },
          signal: abortControllerRef.current.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // User stopped generation - keep current content
        } else {
          updateMessage(sessionId, assistantMessage.id, {
            content: error instanceof LLMError ? error.message : 'Unknown error',
            status: 'error',
          });
        }
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [settings, addMessage, updateMessage, setStreaming]
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, stop };
}
