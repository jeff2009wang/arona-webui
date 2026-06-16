import { Square } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  status: string;
  avatar: string;
  onStop: () => void;
  isStreaming: boolean;
  model: string;
}

export function ChatHeader({ name, status, avatar, onStop, isStreaming, model }: ChatHeaderProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        borderBottom: '1px solid var(--line-soft)',
        background: 'var(--card-header)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={avatar}
          alt={name}
          width={40}
          height={40}
          className="avatar-glow"
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'top center',
            boxShadow: '0 3px 12px var(--shadow)',
            transition: 'box-shadow 0.25s ease',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Online indicator */}
        <span
          aria-hidden="true"
          className="online-pulse"
          style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--status-ok)', border: '2px solid white',
          }}
        />
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold truncate" style={{ color: 'var(--text-main)' }}>
          {name}
        </div>
        <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-sub)' }}>
          <span
            aria-hidden="true"
            style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--status-ok)', flexShrink: 0 }}
          />
          {status}
        </div>
      </div>

      {/* Model tag */}
      <span
        className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
        style={{
          background: 'var(--tool-bg)',
          border: '1px solid var(--line-soft)',
          color: 'var(--text-muted)',
        }}
      >
        {model}
      </span>

      {/* Stop button — only during streaming */}
      {isStreaming && (
        <button
          onClick={onStop}
          aria-label="Stop generation"
          className="stop-btn w-8 h-8 rounded-full grid place-items-center transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'var(--tool-bg)',
            border: '1px solid var(--line)',
            color: 'var(--text-sub)',
          }}
        >
          <Square size={12} />
        </button>
      )}
    </div>
  );
}
