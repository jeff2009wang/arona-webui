import { motion } from 'framer-motion';
import type { Message } from '../../types';
import type { Persona } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';
import { ThinkingBubble } from './ThinkingBubble';

const AVATAR: Record<Persona, string> = {
  arona: '/assets/characters/arona.jpg',
  plana: '/assets/characters/plana.jpg',
};

interface AssistantMessageGroupProps {
  message: Message;
  persona?: Persona;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function AssistantMessageGroup({
  message,
  persona = 'arona',
  isStreaming,
  onRegenerate,
}: AssistantMessageGroupProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasReasoning = (message.reasoning ?? '').trim().length > 0;

  return (
    <div
      className="message-row assistant"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        width: '100%',
        margin: '18px 0',
        justifyContent: 'flex-start',
      }}
    >
      {/* Avatar */}
      <img
        src={AVATAR[persona]}
        alt={persona === 'arona' ? 'Arona' : 'Plana'}
        width={36}
        height={36}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/characters/placeholder.svg'; }}
        className="avatar-glow shrink-0"
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: 'top center',
          boxShadow: '0 2px 8px var(--shadow)',
          transition: 'box-shadow 0.25s ease',
        }}
      />

      <div
        className="assistant-bubble-stack"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 8,
          maxWidth: 'min(920px, 72%)',
          position: 'relative',
        }}
      >
        {hasReasoning && (
          <ThinkingBubble
            persona={persona}
            reasoning={message.reasoning}
            isActive={isStreaming}
            standalone={false}
          />
        )}

        <motion.div
          key="assistant-content"
          initial={{ opacity: 0, scale: 0.98, y: 8, x: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          transition={{
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          data-testid="assistant-bubble"
          className={`assistant-bubble ${isStreaming ? 'streaming-glow' : ''}`}
          style={{
            display: 'inline-block',
            width: 'max-content',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: '14px 18px',
            borderRadius: 22,
            borderBottomLeftRadius: 8,
            background: 'var(--bubble-ai)',
            border: '1px solid var(--line-soft)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px var(--shadow)',
          }}
        >
          <MarkdownRenderer content={message.content} />
        </motion.div>

        <div
          className="message-time"
          style={{ marginTop: 6, fontSize: 12, opacity: 0.55, color: 'var(--text-muted)' }}
        >
          {time}
        </div>

        {/* Message actions hover bar */}
        {!isStreaming && (
          <div className="message-actions-wrapper">
            <MessageActions message={message} onRegenerate={onRegenerate} />
          </div>
        )}
      </div>
    </div>
  );
}
