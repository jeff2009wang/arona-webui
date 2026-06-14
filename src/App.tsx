import { useEffect } from 'react';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatFrame } from './components/chat/ChatFrame';
import { HistoryPanel } from './components/panels/HistoryPanel';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSessionStore } from './stores/sessionStore';
import { useUIStore } from './stores/uiStore';

function MobileSettingsShortcut() {
  const openSettings = useUIStore((s) => s.openSettings);
  return (
    <div className="p-4 flex items-center justify-center h-full">
      <button
        onClick={openSettings}
        aria-label="Open settings"
        className="px-8 py-3 rounded-2xl text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
        style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', boxShadow: '0 4px 16px var(--shadow)' }}
      >
        Open Settings
      </button>
    </div>
  );
}

function App() {
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  return (
    <ThemeProvider>
      <DesktopLayout
        history={<HistoryPanel />}
        chat={<ChatFrame />}
      />
      <MobileLayout
        chat={<ChatFrame />}
        history={<HistoryPanel />}
        settings={<MobileSettingsShortcut />}
      />
      <SettingsModal />
    </ThemeProvider>
  );
}

export default App;
