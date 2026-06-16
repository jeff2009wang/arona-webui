import { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChatHeader } from './ChatHeader';
import { ChatComposer } from './ChatComposer';
import { FABDrawer } from './FABDrawer';
import { EmptyChatState } from './EmptyChatState';
import { AnimatedMessage } from './AnimatedMessage';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useLLM } from '../../hooks/useLLM';
import type { Persona } from '../../types';

const AVATAR: Record<Persona, string> = {
  arona: '/assets/characters/arona.jpg',
  plana: '/assets/characters/plana.jpg',
};

const CHAR_NAME: Record<Persona, string> = { arona: 'Arona', plana: 'Plana' };
const CHAR_STATUS: Record<Persona, string> = {
  arona: 'Online · Schale Terminal',
  plana: 'Online · Aria Terminal',
};

export function ChatFrame() {
  const persona = useSettingsStore((s) => s.persona);
  const model = useSettingsStore((s) => s.model);
  const session = useSessionStore((s) => s.currentSession);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const { sendMessage, stop } = useLLM();
  const openSettings = useUIStore((s) => s.openSettings);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  const lastMessageContentLength = useMemo(() => {
    const last = session?.messages.at(-1);
    if (!last) return 0;
    if (Array.isArray(last.content)) {
      return last.content.reduce((sum, n) => sum + (n.type === 'text' ? (n as { content: string }).content.length : 0), 0);
    }
    return last.content.length ?? 0;
  }, [session?.messages]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = messagesEndRef.current;
      if (!el || typeof el.scrollIntoView !== 'function') return;
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    });
  }, []);

  const updateAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 24;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(!isStreaming);
    }
  }, [session?.messages.length, lastMessageContentLength, scrollToBottom, isStreaming]);

  useEffect(() => {
    isAtBottomRef.current = true;
    scrollToBottom(true);
  }, [session?.id, scrollToBottom]);

  const handleSend = (text: string, images: string[]) => {
    isAtBottomRef.current = true;
    sendMessage(text, images);
  };

  const handleRegenerate = useCallback(() => {
    if (!session) return;
    const lastUserMsg = [...session.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      isAtBottomRef.current = true;
      sendMessage(String(lastUserMsg.content ?? ''), lastUserMsg.images ?? []);
    }
  }, [session, sendMessage]);

  const hasMessages = (session?.messages.length ?? 0) > 0;

  const lastAssistantIndex = useMemo(() => {
    if (!session) return -1;
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'assistant') return i;
    }
    return -1;
  }, [session]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full"
      style={{
        position: 'relative',
        background: 'var(--card)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid var(--line)',
        borderRadius: 22,
        boxShadow: '0 24px 80px var(--shadow)',
        overflow: 'hidden',
      }}
    >
      <ChatHeader
        name={CHAR_NAME[persona]}
        status={CHAR_STATUS[persona]}
        avatar={AVATAR[persona]}
        onStop={stop}
        isStreaming={isStreaming}
        model={model}
      />

      <div
        ref={scrollRef}
        onScroll={updateAtBottom}
        className="flex-1 overflow-y-auto"
        style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {!hasMessages && (
          <EmptyChatState persona={persona} onOpenSettings={openSettings} />
        )}
        {session?.messages.map((m, idx) => {
          const isLastAssistant = m.role === 'assistant' && idx === lastAssistantIndex;
          return (
            <AnimatedMessage
              key={m.id}
              message={m}
              persona={persona}
              isStreaming={isStreaming && isLastAssistant}
              onRegenerate={handleRegenerate}
            />
          );
        })}
        <div ref={messagesEndRef} style={{ height: 1, flexShrink: 0 }} />
      </div>

      <FABDrawer />

      <ChatComposer onSend={handleSend} disabled={isStreaming} persona={persona} />
    </motion.div>
  );
}
