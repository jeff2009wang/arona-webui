import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from '../SettingsModal';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';

vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/uiStore', () => ({ useUIStore: vi.fn() }));

const mockUpdate = vi.fn();
const mockSetPersona = vi.fn();
const mockClose = vi.fn();
const mockExport = vi.fn();

beforeEach(() => {
  vi.mocked(useUIStore).mockImplementation((s: any) =>
    s({ isSettingsOpen: true, closeSettings: mockClose })
  );
  vi.mocked(useSettingsStore).mockImplementation((s: any) =>
    s({
      persona: 'arona', baseUrl: 'http://api', apiKey: 'sk-x', model: 'gpt-4o-mini',
      temperature: 0.7, maxTokens: 2048, systemPrompt: 'You are helpful.',
      enableCgBackground: true, backgroundOpacity: 0.75, backgroundBlur: 0,
      updateConfig: mockUpdate, setPersona: mockSetPersona, resetToDefaults: vi.fn(),
    })
  );
  vi.mocked(useSessionStore).mockImplementation((s: any) =>
    s({ exportToFile: mockExport, importFromFile: vi.fn() })
  );
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

  it('calls closeSettings when close button clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('calls setPersona when Plana is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /plana/i }));
    expect(mockSetPersona).toHaveBeenCalledWith('plana');
  });

  it('does not render when closed', () => {
    vi.mocked(useUIStore).mockImplementation((s: any) =>
      s({ isSettingsOpen: false, closeSettings: mockClose })
    );
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
