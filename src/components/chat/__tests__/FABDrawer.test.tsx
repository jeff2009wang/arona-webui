import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FABDrawer } from '../FABDrawer';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';
import { useLLM } from '../../../hooks/useLLM';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

const mockStop = vi.fn();
const mockClear = vi.fn();
const mockExport = vi.fn();
const mockOpenSettings = vi.fn();

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: any) =>
    selector({ isStreaming: false, currentSessionId: 's1', clearSession: mockClear, exportToFile: mockExport })
  );
  vi.mocked(useUIStore).mockImplementation((selector: any) =>
    selector({ openSettings: mockOpenSettings })
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: mockStop });
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

  it('calls clearSession when clear sub-button clicked', () => {
    render(<FABDrawer />);
    fireEvent.click(screen.getByRole('button', { name: /tools menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(mockClear).toHaveBeenCalledWith('s1');
  });
});
