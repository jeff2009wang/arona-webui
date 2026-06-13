import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { MessageSquare, Clock, Wrench, Settings } from 'lucide-react';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'history' as const, label: 'History', icon: Clock },
  { id: 'tools' as const, label: 'Tools', icon: Wrench },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

export function MobileLayout({
  chat,
  history,
  tools,
  settings,
}: {
  chat: ReactNode;
  history: ReactNode;
  tools: ReactNode;
  settings: ReactNode;
}) {
  const { activeMobileTab, setActiveMobileTab } = useUIStore();

  const content = {
    chat,
    history,
    tools,
    settings,
  };

  return (
    <div className="lg:hidden flex flex-col h-[calc(100vh-50px)]">
      <div className="flex-1 overflow-hidden p-3">{content[activeMobileTab]}</div>
      <nav className="flex justify-around items-center py-2 pb-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMobileTab(tab.id)}
            className={`flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors ${
              activeMobileTab === tab.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg grid place-items-center ${
                activeMobileTab === tab.id
                  ? 'bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white'
                  : 'bg-[var(--tool-bg)] border border-[var(--border)]'
              }`}
            >
              <tab.icon size={12} />
            </div>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
