import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionsPanel } from '../ActionsPanel';
import { useSessionStore } from '../../../stores/sessionStore';
import { useUIStore } from '../../../stores/uiStore';

const mockStop = vi.fn();

vi.mock('../../../hooks/useLLM', () => ({
  useLLM: () => ({
    stop: mockStop,
  }),
}));

vi.mock('lucide-react', () => ({
  RefreshCw: () => <span data-testid="refresh-icon">R</span>,
  Square: () => <span data-testid="square-icon">S</span>,
  Upload: () => <span data-testid="upload-icon">U</span>,
  Trash2: () => <span data-testid="trash-icon">T</span>,
  FileText: () => <span data-testid="file-icon">F</span>,
}));

describe('ActionsPanel', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });
    useUIStore.setState({
      isSettingsOpen: false,
    });
    mockStop.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders current chat info when session exists', () => {
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'My Chat',
          messages: [
            { id: 'm1', role: 'user', content: 'Hello', createdAt: Date.now() },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      currentSessionId: 's1',
    });

    render(<ActionsPanel />);

    expect(screen.getByText('My Chat')).toBeInTheDocument();
    expect(screen.getByText('1 messages')).toBeInTheDocument();
  });

  it('does not render current chat info when no session exists', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
    });

    render(<ActionsPanel />);

    expect(screen.queryByText('Current Chat')).not.toBeInTheDocument();
  });

  it('opens settings when Settings clicked', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
    });

    render(<ActionsPanel />);

    const settingsButton = screen.getByRole('button', { name: /open settings/i });
    fireEvent.click(settingsButton);

    expect(useUIStore.getState().isSettingsOpen).toBe(true);
  });

  it('clears current session when Clear clicked', () => {
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'My Chat',
          messages: [
            { id: 'm1', role: 'user', content: 'Hello', createdAt: Date.now() },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      currentSessionId: 's1',
    });

    render(<ActionsPanel />);

    const clearButton = screen.getByRole('button', { name: /clear current chat/i });
    fireEvent.click(clearButton);

    const session = useSessionStore.getState().sessions.find((s) => s.id === 's1');
    expect(session?.messages).toHaveLength(0);
    expect(session?.title).toBe('New Chat');
  });

  it('disables Stop when not streaming', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });

    render(<ActionsPanel />);

    const stopButton = screen.getByRole('button', { name: /stop generation/i });
    expect(stopButton).toBeDisabled();
  });

  it('enables Stop when streaming', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: true,
    });

    render(<ActionsPanel />);

    const stopButton = screen.getByRole('button', { name: /stop generation/i });
    expect(stopButton).not.toBeDisabled();
  });

  it('calls stop when Stop clicked', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: true,
    });

    render(<ActionsPanel />);

    const stopButton = screen.getByRole('button', { name: /stop generation/i });
    fireEvent.click(stopButton);

    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('disables Regenerate and Export buttons', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
    });

    render(<ActionsPanel />);

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    const exportButton = screen.getByRole('button', { name: /export/i });

    expect(regenerateButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
  });
});
