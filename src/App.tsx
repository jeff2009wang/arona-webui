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
          settings={
            <div className="p-4">
              <button onClick={() => {}} className="text-[var(--primary)]">
                Open Settings
              </button>
            </div>
          }
        />
        <SettingsModal />
      </div>
    </ThemeProvider>
  );
}

export default App;
