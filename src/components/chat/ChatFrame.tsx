import { useRef, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { AssistantBubble } from './AssistantBubble';
import { UserBubble } from './UserBubble';
import { ToolCard } from './ToolCard';
import { TypingIndicator } from './TypingIndicator';
import { ChatComposer } from './ChatComposer';
import { FABDrawer } from './FABDrawer';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLLM } from '../../hooks/useLLM';
import type { Message, Persona } from '../../types';

const AVATAR: Record<string, string> = {
  arona: '/assets/placeholders/avatar-arona.svg',
  plana: '/assets/placeholders/avatar-plana.svg',
};

const CHAR_NAME: Record<string, string> = { arona: 'Arona', plana: 'Plana' };
const CHAR_STATUS: Record<string, string> = {
  arona: 'Online · Schale Terminal',
  plana: 'Online · Aria Terminal',
};

function renderMessage(message: Message, persona: Persona) {
  if (message.role === 'user') return <UserBubble key={message.id} message={message} />;
  if (message.role === 'assistant') return <AssistantBubble key={message.id} message={message} persona={persona} />;
  if (message.role === 'tool' && message.toolCalls) {
    return (
      <div key={message.id} className="flex flex-col gap-2">
        {message.toolCalls.map((tc) => <ToolCard key={tc.id} toolCall={tc} />)}
      </div>
    );
  }
  return null;
}

export function ChatFrame() {
  const persona = useSettingsStore((s) => s.persona);
  const model = useSettingsStore((s) => s.model);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const { sendMessage, stop } = useLLM();

  const session = sessions.find((s) => s.id === currentSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages.length, isStreaming]);

  const handleSend = (text: string, images: string[]) => {
    if (currentSessionId) sendMessage(currentSessionId, text, images);
  };

  return (
    <div
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

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {session?.messages.map((m) => renderMessage(m, persona))}
        {isStreaming && <TypingIndicator persona={persona} />}
      </div>

      {/* FAB overlay */}
      <FABDrawer />

      <ChatComposer onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
