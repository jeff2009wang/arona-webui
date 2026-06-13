import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { MessageSquare, Clock, Wrench, Settings } from 'lucide-react';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

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
  const activeMobileTab = useUIStore((s) => s.activeMobileTab);
  const setActiveMobileTab = useUIStore((s) => s.setActiveMobileTab);

  return (
    <div className="lg:hidden flex flex-col h-[calc(100vh-var(--header-height))]">
      <div className="flex-1 overflow-hidden p-3 relative">
        <div hidden={activeMobileTab !== 'chat'} className="h-full">{chat}</div>
        <div hidden={activeMobileTab !== 'history'} className="h-full">{history}</div>
        <div hidden={activeMobileTab !== 'tools'} className="h-full">{tools}</div>
        <div hidden={activeMobileTab !== 'settings'} className="h-full">{settings}</div>
      </div>
      <nav aria-label="Mobile tabs" className="flex justify-around items-center py-2 pb-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div role="tablist" className="flex justify-around w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeMobileTab === tab.id}
              aria-label={tab.label}
              onClick={() => setActiveMobileTab(tab.id)}
              className={`flex flex-col items-center gap-1 text-[9px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none ${
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
        </div>
      </nav>
    </div>
  );
}
