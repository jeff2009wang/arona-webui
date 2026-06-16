import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import type { Persona } from '../../types';

const COPY: Record<Persona, { greeting: string; sub: string }> = {
  arona: {
    greeting: '欢迎回来，老师。今天想聊些什么？',
    sub: 'Arona 已准备好协助您。',
  },
  plana: {
    greeting: '终端已就绪。请输入任务。',
    sub: 'Plana 系统在线，等待指令。',
  },
};

interface EmptyChatStateProps {
  persona?: Persona;
  onOpenSettings?: () => void;
}

export function EmptyChatState({ persona = 'arona', onOpenSettings }: EmptyChatStateProps) {
  const copy = COPY[persona];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-5 py-16 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--line-soft)',
            boxShadow: '0 4px 16px var(--shadow)',
          }}
        >
          <img
            src={`/assets/characters/${persona}.jpg`}
            alt={persona === 'arona' ? 'Arona' : 'Plana'}
            width={48}
            height={48}
            className="rounded-full object-cover object-top"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/characters/placeholder.svg'; }}
          />
        </div>
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
          style={{
            background: 'var(--status-ok)',
            borderColor: 'var(--card)',
          }}
        />
      </motion.div>

      <div className="flex flex-col gap-1.5">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-[15px] font-bold"
          style={{ color: 'var(--text-main)' }}
        >
          {copy.greeting}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-[12px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {copy.sub}
        </motion.p>
      </div>

      {onOpenSettings && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none hover:brightness-105"
            style={{
              background: 'var(--tool-bg)',
              border: '1px solid var(--line-soft)',
              color: 'var(--text-sub)',
            }}
          >
            <Settings size={13} />
            打开设置
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
