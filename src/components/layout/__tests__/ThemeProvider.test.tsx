import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useSettingsStore } from '../../../stores/settingsStore';

vi.mock('../../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

const mockSettings = {
  persona: 'arona' as const,
  enableCgBackground: false,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
};

beforeEach(() => {
  vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
    selector(mockSettings)
  );
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
    vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
      selector({ ...mockSettings, persona: 'plana' })
    );
    render(<ThemeProvider><div /></ThemeProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'plana');
  });

  it('renders a fixed background div', () => {
    const { container } = render(<ThemeProvider><div /></ThemeProvider>);
    const bgDiv = container.querySelector('[aria-hidden="true"]');
    expect(bgDiv).toBeInTheDocument();
  });
});
