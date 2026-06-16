import { motion } from 'framer-motion';
import type { Persona } from '../../types';

const AVATAR: Record<Persona, string> = {
  arona: '/assets/characters/arona.jpg',
  plana: '/assets/characters/plana.jpg',
};

export function TypingIndicator({ persona = 'arona' }: { persona?: Persona }) {
  return (
    <div className="flex items-end gap-2">
      <img
        src={AVATAR[persona]}
        alt={persona === 'arona' ? 'Arona' : 'Plana'}
        width={36}
        height={36}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/characters/placeholder.svg'; }}
        style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover', objectPosition: 'top center' }}
      />
      <div
        className="flex items-center gap-1 px-4 py-3"
        style={{
          borderRadius: 22,
          borderBottomLeftRadius: 4,
          background: 'var(--bubble-ai)',
          border: '1px solid var(--line-soft)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px var(--shadow)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            data-testid="typing-dot"
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
    </div>
  );
}
