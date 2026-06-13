import { ChatHeader } from './ChatHeader';
import { AssistantBubble } from './AssistantBubble';
import { UserBubble } from './UserBubble';
import { ToolCard } from './ToolCard';
import { TypingIndicator } from './TypingIndicator';
import { ChatComposer } from './ChatComposer';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLLM } from '../../hooks/useLLM';
import type { Message } from '../../types';

function renderMessage(message: Message) {
  if (message.role === 'user') return <UserBubble key={message.id} message={message} />;
  if (message.role === 'assistant') return <AssistantBubble key={message.id} message={message} />;
  if (message.role === 'tool' && message.toolCalls) {
    return message.toolCalls.map((tc) => <ToolCard key={tc.id} toolCall={tc} />);
  }
  return null;
}

export function ChatPhoneFrame() {
  const persona = useSettingsStore((state) => state.persona);
  const { currentSessionId, sessions, isStreaming } = useSessionStore();
  const { sendMessage, stop } = useLLM();

  const session = sessions.find((s) => s.id === currentSessionId);

  const handleSend = (content: string) => {
    if (currentSessionId) sendMessage(currentSessionId, content);
  };

  return (
    <div className="relative flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] shadow-soft overflow-hidden">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-[18px] bg-[var(--tool-bg)] border border-[var(--border)] rounded-b-[11px] border-t-0 z-10" />
      <ChatHeader
        name={persona === 'arona' ? 'Arona' : 'Plana'}
        status={persona === 'arona' ? 'Online · Schale Terminal' : 'Online · Aria Terminal'}
        avatar={persona === 'arona' ? '🎓' : '🌙'}
        onStop={stop}
      />
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
        {session?.messages.map((message) => renderMessage(message))}
        {isStreaming && <TypingIndicator />}
      </div>
      <ChatComposer onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
