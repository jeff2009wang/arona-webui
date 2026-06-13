import { useEffect } from 'react';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { TopStatusBar } from './components/layout/TopStatusBar';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatPhoneFrame } from './components/chat/ChatPhoneFrame';
import { HistoryPanel } from './components/panels/HistoryPanel';
import { ActionsPanel } from './components/panels/ActionsPanel';
import { SettingsModal } from './components/settings/SettingsModal';
import { useSessionStore } from './stores/sessionStore';

import { useUIStore } from './stores/uiStore';

function MobileSettingsShortcut() {
  const openSettings = useUIStore((s) => s.openSettings);
  return (
    <div className="p-4">
      <button
        onClick={openSettings}
        aria-label="Open settings"
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white text-sm font-bold shadow-soft-strong focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
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
      <div className="min-h-screen">
        <TopStatusBar />
        <DesktopLayout
          history={<HistoryPanel />}
          chat={<ChatPhoneFrame />}
          actions={<ActionsPanel />}
        />
        <MobileLayout
          chat={<ChatPhoneFrame />}
          history={<HistoryPanel />}
          tools={<ActionsPanel />}
          settings={<MobileSettingsShortcut />}
        />
        <SettingsModal />
      </div>
    </ThemeProvider>
  );
}

export default App;
