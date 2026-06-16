import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsModal } from '../SettingsModal';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useUIStore } from '../../../stores/uiStore';
import { useToast } from '../../../hooks/useToast';
import type { SettingsState } from '../../../stores/settingsStore';
import type { UIState } from '../../../stores/uiStore';

vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../../../hooks/useToast', () => ({ useToast: vi.fn() }));

const mockUpdate = vi.fn();
const mockSetPersona = vi.fn();
const mockClose = vi.fn();
const mockToastSuccess = vi.fn();

const settingsState = {
  persona: 'arona' as const,
  baseUrl: 'http://api',
  apiKey: 'sk-x',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are helpful.',
  enableCgBackground: true,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
  streamEnabled: true,
  localBackgroundPath: '',
  localAvatarPath: '',
  autoSummarize: false,
  updateConfig: mockUpdate,
  setPersona: mockSetPersona,
  resetToDefaults: vi.fn(),
  clearAllData: vi.fn(),
};

const uiState = {
  isSettingsOpen: true,
  closeSettings: mockClose,
};

beforeEach(() => {
  mockClose.mockClear();
  mockToastSuccess.mockClear();
  vi.mocked(useUIStore).mockImplementation((selector: (state: UIState) => unknown) =>
    selector(uiState as unknown as UIState)
  );
  vi.mocked(useSettingsStore).mockImplementation((selector: (state: SettingsState) => unknown) =>
    selector(settingsState as SettingsState)
  );
  vi.mocked(useToast).mockReturnValue({
    toast: { success: mockToastSuccess, error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    addToast: vi.fn(),
    removeToast: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
});

describe('SettingsModal', () => {
  it('renders when open', () => {
    render(<SettingsModal />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows Theme selector with Arona and Plana', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Arona')).toBeInTheDocument();
    expect(screen.getByText('Plana')).toBeInTheDocument();
  });

  it('shows Max Tokens input', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
  });

  it('shows Enable CG Background toggle', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/enable cg background/i)).toBeInTheDocument();
  });

  it('shows Auto Summarize Session toggle and calls updateConfig', () => {
    render(<SettingsModal />);
    const checkbox = screen.getByLabelText(/auto summarize session/i) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(mockUpdate).toHaveBeenCalledWith({ autoSummarize: true });
  });

  it('shows Local Background Path input', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/local background path/i)).toBeInTheDocument();
  });

  it('shows Local Avatar Path input', () => {
    render(<SettingsModal />);
    expect(screen.getByLabelText(/local avatar path/i)).toBeInTheDocument();
  });

  it('uses PasswordInput for API key (type=password)', () => {
    render(<SettingsModal />);
    const input = document.getElementById('settings-api-key') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('password');
  });

  it('calls closeSettings when close button clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls closeSettings when Escape is pressed', () => {
    render(<SettingsModal />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls closeSettings when backdrop is clicked', () => {
    render(<SettingsModal />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls setPersona when Plana is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /plana/i }));
    expect(mockSetPersona).toHaveBeenCalledWith('plana');
  });

  it('does not render when closed', () => {
    vi.mocked(useUIStore).mockImplementation((selector: (state: UIState) => unknown) =>
      selector({ isSettingsOpen: false, closeSettings: mockClose } as unknown as UIState)
    );
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens confirm dialog when Reset All to Defaults clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /reset all to defaults/i }));
    expect(screen.getByText(/reset to defaults/i)).toBeInTheDocument();
  });

  it('opens confirm dialog when Clear All Local Data clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /clear all local data/i }));
    expect(screen.getByRole('dialog', { name: /clear all local data/i })).toBeInTheDocument();
  });

  it('does not render export or import buttons', () => {
    render(<SettingsModal />);
    expect(screen.queryByRole('button', { name: /export sessions/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /import/i })).toBeNull();
  });
});
