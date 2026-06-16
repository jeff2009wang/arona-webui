import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { Persona } from '../../types';

const AVATAR: Record<Persona, string> = {
  arona: '/assets/characters/arona.jpg',
  plana: '/assets/characters/plana.jpg',
};

interface ThinkingBubbleProps {
  persona?: Persona;
  reasoning?: string;
  isActive?: boolean;
  standalone?: boolean;
}

export function ThinkingBubble({
  persona = 'arona',
  reasoning,
  isActive = false,
  standalone = true,
}: ThinkingBubbleProps) {
  const hasReasoning = (reasoning ?? '').trim().length > 0;
  const [expanded, setExpanded] = useState(isActive);

  const bubble = (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8, x: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`assistant-bubble ${isActive ? 'streaming-glow' : ''}`}
      style={{
        display: 'inline-block',
        width: 'max-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '12px 16px',
        borderRadius: 22,
        borderBottomLeftRadius: 8,
        background: 'var(--bubble-ai)',
        border: '1px solid var(--line-soft)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px var(--shadow)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: hasReasoning && expanded ? 8 : 0,
        }}
      >
        <Sparkles size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--primary)',
            letterSpacing: 0.2,
          }}
        >
          {isActive ? '思考中...' : '思考过程'}
        </span>
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 2 }}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                data-testid="thinking-dot"
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: 'var(--primary)' }}
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
        {hasReasoning && !isActive && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? '收起思考过程' : '展开思考过程'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 'auto',
              padding: 2,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--tool-bg)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasReasoning && expanded && (
          <motion.div
            key="reasoning"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              data-testid="reasoning-content"
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                padding: '10px 12px',
                marginTop: 4,
                borderRadius: 14,
                background: 'var(--tool-bg)',
                color: 'var(--text-sub)',
                fontSize: 13,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid var(--line-soft)',
              }}
            >
              {reasoning}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (!standalone) return bubble;

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
      <img
        src={AVATAR[persona]}
        alt={persona === 'arona' ? 'Arona' : 'Plana'}
        width={36}
        height={36}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/assets/characters/placeholder.svg';
        }}
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
        {bubble}
      </div>
    </div>
  );
}
