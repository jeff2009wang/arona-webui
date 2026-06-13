import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal';
import { useUIStore } from '../../../stores/uiStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useSessionStore } from '../../../stores/sessionStore';

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">×</span>,
  Upload: () => <span data-testid="upload-icon">↑</span>,
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    useUIStore.setState({ isSettingsOpen: false });
    useSettingsStore.getState().resetToDefaults();
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isSettingsOpen is false', () => {
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders all settings fields when open', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Terminal Settings')).toBeInTheDocument();
    expect(screen.getByLabelText(/close settings/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /arona/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plana/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Base URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/system prompt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export sessions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import sessions/i })).toBeInTheDocument();
  });

  it('calls closeSettings when close button clicked', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const closeButton = screen.getByLabelText(/close settings/i);
    fireEvent.click(closeButton);

    expect(useUIStore.getState().isSettingsOpen).toBe(false);
  });

  it('calls setPersona when Arona button clicked', () => {
    useSettingsStore.getState().setPersona('plana');
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const aronaButton = screen.getByRole('button', { name: /arona/i });
    fireEvent.click(aronaButton);

    expect(useSettingsStore.getState().persona).toBe('arona');
  });

  it('calls setPersona when Plana button clicked', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const planaButton = screen.getByRole('button', { name: /plana/i });
    fireEvent.click(planaButton);

    expect(useSettingsStore.getState().persona).toBe('plana');
  });

  it('calls updateConfig when base URL input changes', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const input = screen.getByPlaceholderText('Base URL');
    fireEvent.change(input, { target: { value: 'https://api.example.com' } });

    expect(useSettingsStore.getState().baseUrl).toBe('https://api.example.com');
  });

  it('calls updateConfig when API key input changes', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const input = screen.getByPlaceholderText('API Key');
    fireEvent.change(input, { target: { value: 'sk-test' } });

    expect(useSettingsStore.getState().apiKey).toBe('sk-test');
  });

  it('calls updateConfig when model input changes', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const input = screen.getByPlaceholderText('gpt-4o-mini');
    fireEvent.change(input, { target: { value: 'gpt-4o' } });

    expect(useSettingsStore.getState().model).toBe('gpt-4o');
  });

  it('calls updateConfig when temperature input changes', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const input = screen.getByLabelText(/temperature/i);
    fireEvent.change(input, { target: { value: '1.2' } });

    expect(useSettingsStore.getState().temperature).toBe(1.2);
  });

  it('calls updateConfig when system prompt textarea changes', () => {
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const textarea = screen.getByLabelText(/system prompt/i);
    fireEvent.change(textarea, { target: { value: 'New prompt' } });

    expect(useSettingsStore.getState().systemPrompt).toBe('New prompt');
  });

  it('calls exportToFile when Export button clicked', () => {
    const exportSpy = vi.spyOn(useSessionStore.getState(), 'exportToFile').mockImplementation(() => {});
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const exportButton = screen.getByRole('button', { name: /export sessions/i });
    fireEvent.click(exportButton);

    expect(exportSpy).toHaveBeenCalled();
    exportSpy.mockRestore();
  });

  it('triggers file input and calls importFromFile when a file is selected', async () => {
    const importSpy = vi.spyOn(useSessionStore.getState(), 'importFromFile').mockImplementation(() => {});
    useUIStore.setState({ isSettingsOpen: true });
    render(<SettingsModal />);

    const fileInput = screen.getByLabelText(/import sessions/i).closest('div')?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"sessions":[]}'], 'test.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(file);
    });
    importSpy.mockRestore();
  });
});
