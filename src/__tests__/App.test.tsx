import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('../components/layout/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

vi.mock('../stores/sessionStore', () => ({
  useSessionStore: vi.fn((selector) => {
    const state = {
      currentSession: { id: 's1', messages: [] },
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
});
