import { Plus } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export function HistoryPanel() {
  const sessions = useSessionStore((s) => s.sessions);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const createSession = useSessionStore((s) => s.createSession);
  const selectSession = useSessionStore((s) => s.selectSession);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--line)',
        borderRadius: 20,
        boxShadow: '0 8px 32px var(--shadow)',
      }}
    >
      {/* Header */}
      <div
        className="px-3 pt-4 pb-3"
        style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--card-header)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: 'var(--primary)' }}
          >
            Chats
          </span>
          <span
            className="text-[8px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--tool-bg)', color: 'var(--text-muted)', border: '1px solid var(--line-soft)' }}
          >
            {sessions.length}
          </span>
        </div>
        <button
          onClick={createSession}
          aria-label="Create new chat session"
          className="w-full py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            border: '1.5px dashed var(--primary)',
            color: 'var(--primary)',
            background: 'rgba(31,168,255,0.04)',
          }}
        >
          <Plus size={11} />
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1" role="list">
        {sessions.map((session) => {
          const isActive = currentSessionId === session.id;
          const lastMsg = session.messages.at(-1)?.content ?? '';
          return (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              role="button"
              aria-selected={isActive}
              aria-label={session.title}
              className="flex items-center gap-2 p-2 rounded-[13px] text-left transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
              style={{
                background: isActive ? 'rgba(31,168,255,0.10)' : 'rgba(255,255,255,0.25)',
                border: isActive ? '1px solid rgba(31,168,255,0.38)' : '1px solid transparent',
              }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-[9px] grid place-items-center text-sm shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                  boxShadow: '0 2px 8px var(--shadow)',
                }}
                aria-hidden="true"
              >
                🎓
              </div>
              {/* Meta */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11px] font-bold truncate"
                  style={{ color: 'var(--text-main)' }}
                >
                  {session.title}
                </div>
                <div
                  className="text-[9px] truncate mt-0.5"
                  style={{ color: 'var(--text-sub)' }}
                >
                  {lastMsg.slice(0, 28) || 'No messages'}
                </div>
              </div>
              {/* Time */}
              <div className="text-[8px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                {timeAgo(session.updatedAt)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
