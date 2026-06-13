import { RefreshCw, Square, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  status: string;
  avatar: string;
  onRegenerate?: () => void;
  onStop?: () => void;
}

export function ChatHeader({ name, status, avatar, onRegenerate, onStop }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-3 mt-2 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] grid place-items-center text-lg border-2 border-[var(--bg-card)] shadow-soft-strong">
          {avatar}
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--text-main)]">{name}</div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-semibold">
            <span className="w-[5px] h-[5px] rounded-full bg-[var(--status-online)]" />
            {status}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          aria-label="Regenerate response"
          onClick={() => onRegenerate?.()}
          className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors shadow-soft focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
        >
          <RefreshCw size={14} />
        </button>
        <button
          aria-label="Stop generation"
          onClick={() => onStop?.()}
          className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors shadow-soft focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
        >
          <Square size={12} />
        </button>
        <button
          aria-label="More options"
          disabled
          title="More options"
          className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors shadow-soft focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
        >
          <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );
}
