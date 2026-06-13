import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryPanel } from '../HistoryPanel';
import { useSessionStore } from '../../../stores/sessionStore';

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
}));

describe('HistoryPanel', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sessions', () => {
    const now = new Date('2026-06-13T12:00:00Z').getTime();
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'First Chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentSessionId: null,
    });

    render(<HistoryPanel />);

    expect(screen.getByText('First Chat')).toBeInTheDocument();
  });

  it('shows session title, last message, and date', () => {
    const now = new Date('2026-06-13T12:00:00Z').getTime();
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'Test Chat',
          messages: [
            { id: 'm1', role: 'user', content: 'Hello world this is a message', createdAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentSessionId: null,
    });

    render(<HistoryPanel />);

    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.getByText('Hello world this is a message'.slice(0, 30))).toBeInTheDocument();
    expect(screen.getByText('2026/6/13')).toBeInTheDocument();
  });

  it('shows "No messages" when session has no messages', () => {
    const now = new Date('2026-06-13T12:00:00Z').getTime();
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'Empty Chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentSessionId: null,
    });

    render(<HistoryPanel />);

    expect(screen.getByText('No messages')).toBeInTheDocument();
  });

  it('highlights selected session', () => {
    const now = new Date('2026-06-13T12:00:00Z').getTime();
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'Chat One',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 's2',
          title: 'Chat Two',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentSessionId: 's2',
    });

    render(<HistoryPanel />);

    const buttons = screen.getAllByRole('listitem');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute('aria-selected', 'false');
    expect(buttons[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('creates new session when "New Chat" clicked', () => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
    });

    render(<HistoryPanel />);

    const newChatButton = screen.getByRole('button', { name: /create new chat session/i });
    fireEvent.click(newChatButton);

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.currentSessionId).toBe(state.sessions[0].id);
  });

  it('selects session when clicked', () => {
    const now = new Date('2026-06-13T12:00:00Z').getTime();
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'Chat One',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 's2',
          title: 'Chat Two',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentSessionId: 's1',
    });

    render(<HistoryPanel />);

    const sessionButtons = screen.getAllByRole('listitem');
    fireEvent.click(sessionButtons[1]);

    expect(useSessionStore.getState().currentSessionId).toBe('s2');
  });

  it('has a list container with role list', () => {
    const now = new Date('2026-06-13T12:00:00Z').getTime();
    useSessionStore.setState({
      sessions: [
        {
          id: 's1',
          title: 'Chat One',
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      currentSessionId: null,
    });

    render(<HistoryPanel />);

    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
