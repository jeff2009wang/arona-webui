import { Plus } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';

export function HistoryPanel() {
  const { sessions, currentSessionId, createSession, selectSession } = useSessionStore();

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[26px] shadow-soft overflow-hidden">
      <div className="p-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[var(--text-main)]">History</span>
          <span className="text-[9px] text-[var(--text-muted)] font-semibold bg-[var(--tool-bg)] px-2 py-0.5 rounded-full">
            {sessions.length} chats
          </span>
        </div>
        <button
          onClick={createSession}
          aria-label="Create new chat session"
          className="w-full py-2 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--primary)] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[var(--tool-bg)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
        >
          <Plus size={12} />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1" role="list">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => selectSession(session.id)}
            role="listitem"
            aria-selected={currentSessionId === session.id}
            aria-label={`Select session ${session.title}`}
            className={`flex items-center gap-2 p-2.5 rounded-2xl text-left border transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none ${
              currentSessionId === session.id
                ? 'bg-[var(--tool-bg)] border-[var(--primary)] shadow-soft'
                : 'border-transparent hover:bg-[var(--tool-bg)]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] grid place-items-center text-sm shrink-0 shadow-soft">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-[var(--text-main)] truncate">{session.title}</div>
              <div className="text-[9px] text-[var(--text-secondary)] truncate">
                {session.messages.at(-1)?.content.slice(0, 30) || 'No messages'}
              </div>
            </div>
            <div className="text-[8px] text-[var(--text-muted)] font-medium">
              {new Date(session.updatedAt).toLocaleDateString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
