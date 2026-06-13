import { RefreshCw, Square, Upload, Trash2, FileText } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';
import { useLLM } from '../../hooks/useLLM';

export function ActionsPanel() {
  const { sessions, currentSessionId, isStreaming, clearSession } = useSessionStore();
  const { openSettings } = useUIStore();
  const { stop } = useLLM();

  const session = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[26px] shadow-soft overflow-hidden">
      <div className="p-4 pb-3 border-b border-[var(--border)]">
        <span className="text-xs font-bold text-[var(--text-main)]">Actions</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3">
        {session && (
          <div className="bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3">
            <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Current Chat</div>
            <div className="text-xs font-bold text-[var(--text-main)] truncate">{session.title}</div>
            <div className="text-[9px] text-[var(--text-secondary)] mt-1">
              {session.messages.length} messages
            </div>
          </div>
        )}

        <div className="bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3">
          <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Quick Actions</div>
          <div className="flex flex-col gap-1.5">
            <button
              disabled
              title="Coming soon"
              aria-label="Regenerate last message (coming soon)"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white text-[10px] font-semibold flex items-center justify-center gap-1 shadow-soft-strong disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <RefreshCw size={11} /> Regenerate
            </button>
            <button
              onClick={stop}
              disabled={!isStreaming}
              aria-label="Stop generation"
              className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <Square size={10} /> Stop
            </button>
            <button
              disabled
              title="Coming soon"
              aria-label="Export chat (coming soon)"
              className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <Upload size={11} /> Export
            </button>
            <button
              onClick={() => currentSessionId && clearSession(currentSessionId)}
              aria-label="Clear current chat"
              className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 hover:border-red-400 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>

        <div className="bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3">
          <div className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">Terminal</div>
          <button
            onClick={openSettings}
            aria-label="Open settings"
            className="w-full py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[10px] font-semibold flex items-center justify-center gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          >
            <FileText size={11} /> Settings
          </button>
        </div>
      </div>
    </div>
  );
}
