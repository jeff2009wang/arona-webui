import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useSettingsStore } from '../../../stores/settingsStore';
import type { SettingsState } from '../../../stores/settingsStore';

vi.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

const mockSettings = {
  persona: 'arona' as const,
  enableCgBackground: false,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
  localBackgroundPath: '',
};

beforeEach(() => {
  vi.mocked(useSettingsStore).mockImplementation((selector: (state: SettingsState) => unknown) =>
    selector(mockSettings as SettingsState)
  );
});

afterEach(() => {
  cleanup();
});

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(<ThemeProvider><div data-testid="child" /></ThemeProvider>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('sets data-theme attribute on documentElement', () => {
    render(<ThemeProvider><div /></ThemeProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'arona');
  });

  it('sets data-theme to plana when persona is plana', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector: (state: SettingsState) => unknown) =>
      selector({ ...mockSettings, persona: 'plana' as const } as SettingsState)
    );
    render(<ThemeProvider><div /></ThemeProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'plana');
  });

  it('renders a fixed background div', () => {
    const { container } = render(<ThemeProvider><div /></ThemeProvider>);
    const bgDiv = container.querySelector('[aria-hidden="true"]');
    expect(bgDiv).toBeInTheDocument();
  });

  it('applies transition style to background div', () => {
    const { container } = render(<ThemeProvider><div /></ThemeProvider>);
    const bgDiv = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(bgDiv.style.transition).toContain('background');
  });
});
