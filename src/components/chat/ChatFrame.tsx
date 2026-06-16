import { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChatHeader } from './ChatHeader';
import { ThinkingBubble } from './ThinkingBubble';
import { ChatComposer } from './ChatComposer';
import { FABDrawer } from './FABDrawer';
import { EmptyChatState } from './EmptyChatState';
import { AnimatedMessage } from './AnimatedMessage';
import { ToolActivityGroup } from './ToolActivityGroup';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useLLM } from '../../hooks/useLLM';
import type { Persona, Message } from '../../types';

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
    return last?.content.length ?? 0;
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
      sendMessage(lastUserMsg.content, lastUserMsg.images ?? []);
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

  const renderGroups = useMemo(() => {
    if (!session) return [] as Array<
      | { type: 'message'; message: Message }
      | { type: 'tool'; messages: Message[]; toolCalls: NonNullable<Message['toolCalls']> }
    >;
    const groups: Array<
      | { type: 'message'; message: Message }
      | { type: 'tool'; messages: Message[]; toolCalls: NonNullable<Message['toolCalls']> }
    > = [];

    for (const m of session.messages) {
      const calls = m.toolCalls;
      if (m.role === 'tool' && calls && calls.length > 0) {
        const last = groups[groups.length - 1];
        if (last?.type === 'tool') {
          last.messages.push(m);
          last.toolCalls.push(...calls);
        } else {
          groups.push({ type: 'tool', messages: [m], toolCalls: [...calls] });
        }
      } else {
        groups.push({ type: 'message', message: m });
      }
    }
    return groups;
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
        {renderGroups.map((group, groupIdx) => {
          const isLastGroup = groupIdx === renderGroups.length - 1;
          if (group.type === 'tool') {
            return (
              <ToolActivityGroup
                key={`tool-group-${groupIdx}`}
                toolCalls={group.toolCalls}
                persona={persona}
                isStreaming={isStreaming && isLastGroup}
              />
            );
          }

          const m = group.message;
          const idx = session!.messages.indexOf(m);
          const isEmptyStreamingAssistant =
            isStreaming &&
            m.role === 'assistant' &&
            m.content.trim().length === 0;
          if (isEmptyStreamingAssistant) {
            return (
              <ThinkingBubble
                key="thinking"
                persona={persona}
                reasoning={m.reasoning}
                isActive
              />
            );
          }
          return (
            <AnimatedMessage
              key={m.id}
              message={m}
              persona={persona}
              isStreaming={isStreaming && m.role === 'assistant' && idx === lastAssistantIndex}
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
