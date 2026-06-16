import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FABDrawer } from '../FABDrawer';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';
import { useLLM } from '../../../hooks/useLLM';
import type { SessionState } from '../../../stores/sessionStore';
import type { UIState } from '../../../stores/uiStore';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

const mockStop = vi.fn();
const mockClear = vi.fn();
const mockOpenSettings = vi.fn();

const sessionState = {
  isStreaming: false,
  clearChat: mockClear,
};

const uiState = {
  openSettings: mockOpenSettings,
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
    selector(sessionState as unknown as SessionState)
  );
  vi.mocked(useUIStore).mockImplementation((selector: (state: UIState) => unknown) =>
    selector(uiState as unknown as UIState)
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: mockStop });
});

afterEach(() => {
  cleanup();
});

describe('FABDrawer', () => {
  it('renders main FAB button', () => {
    render(<FABDrawer />);
    expect(screen.getByRole('button', { name: /tools menu/i })).toBeInTheDocument();
  });

  it('sub-buttons are hidden by default', () => {
    render(<FABDrawer />);
    expect(screen.queryByRole('button', { name: /settings/i })).toBeNull();
  });

  it('reveals sub-buttons when FAB is clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('calls openSettings when settings sub-button clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(mockOpenSettings).toHaveBeenCalledOnce();
  });

  it('calls clearChat when clear sub-button clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(mockClear).toHaveBeenCalledOnce();
  });

  it('does not render export or import buttons', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    expect(screen.queryByRole('button', { name: /export/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /import/i })).toBeNull();
  });
});
