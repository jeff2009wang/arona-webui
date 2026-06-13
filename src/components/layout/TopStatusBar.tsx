import { Settings } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export function TopStatusBar() {
  const { persona, setPersona } = useSettingsStore();
  const { openSettings } = useUIStore();

  return (
    <header className="sticky top-0 z-10 h-[50px] flex items-center justify-between px-5 border-b border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-md shadow-soft">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] grid place-items-center text-white text-xs font-bold shadow-soft-strong">
          {persona === 'arona' ? 'A' : 'P'}
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--text-main)] tracking-wide">
            {persona === 'arona' ? 'ARONA CHAT' : 'PLANA CHAT'}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] font-semibold tracking-wider">
            {persona === 'arona' ? 'SCHALE TERMINAL' : 'ARIA TERMINAL'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] shadow-soft">
          <button
            onClick={() => setPersona('arona')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              persona === 'arona'
                ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white shadow-soft-strong'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Arona
          </button>
          <button
            onClick={() => setPersona('plana')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              persona === 'plana'
                ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white shadow-soft-strong'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Plana
          </button>
        </div>
        <button
          onClick={openSettings}
          className="w-[30px] h-[30px] rounded-[9px] border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--primary)] shadow-soft hover:border-[var(--primary)] transition-colors"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
}
