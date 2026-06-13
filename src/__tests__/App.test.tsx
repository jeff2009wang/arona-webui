import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock child components to keep the test lightweight
vi.mock('../components/layout/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/layout/TopStatusBar', () => ({
  TopStatusBar: () => (
    <header data-testid="top-status-bar">
      <div>ARONA CHAT</div>
    </header>
  ),
}));

vi.mock('../components/layout/DesktopLayout', () => ({
  DesktopLayout: () => <div data-testid="desktop-layout">Desktop</div>,
}));

vi.mock('../components/layout/MobileLayout', () => ({
  MobileLayout: ({ settings }: { settings: React.ReactNode }) => (
    <div data-testid="mobile-layout">
      <div data-testid="mobile-settings">{settings}</div>
    </div>
  ),
}));

vi.mock('../components/settings/SettingsModal', () => ({
  SettingsModal: () => <div data-testid="settings-modal">Settings</div>,
}));

// Mock session store
const mockCreateSession = vi.fn();
const mockSessions: unknown[] = [];

vi.mock('../stores/sessionStore', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      sessions: mockSessions,
      createSession: mockCreateSession,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      openSettings: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions.length = 0;
  });

  it('renders the top status bar with ARONA CHAT', () => {
    render(<App />);
    expect(screen.getByTestId('top-status-bar')).toBeInTheDocument();
    expect(screen.getByText('ARONA CHAT')).toBeInTheDocument();
  });

  it('renders desktop and mobile layouts', () => {
    render(<App />);
    expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  });

  it('renders the settings modal', () => {
    render(<App />);
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('renders the mobile settings shortcut', () => {
    render(<App />);
    expect(screen.getByTestId('mobile-settings')).toBeInTheDocument();
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
  });

  it('creates a session on first load when no sessions exist', () => {
    render(<App />);
    expect(mockCreateSession).toHaveBeenCalledTimes(1);
  });

  it('does not create a session when sessions already exist', () => {
    mockSessions.push({ id: '1', title: 'Test' } as unknown);
    render(<App />);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
