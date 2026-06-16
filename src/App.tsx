import { ThemeProvider } from './components/layout/ThemeProvider';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { ChatFrame } from './components/chat/ChatFrame';
import { SettingsModal } from './components/settings/SettingsModal';
import { useUIStore } from './stores/uiStore';
import { ToastProvider } from './hooks/useToast';

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
  return (
    <ToastProvider>
      <ThemeProvider>
        <DesktopLayout chat={<ChatFrame />} />
        <MobileLayout chat={<ChatFrame />} settings={<MobileSettingsShortcut />} />
        <SettingsModal />
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
