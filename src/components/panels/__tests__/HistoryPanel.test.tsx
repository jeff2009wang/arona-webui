import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryPanel } from '../HistoryPanel';
import { useSessionStore } from '../../../stores/sessionStore';

vi.mock('../../../stores/sessionStore', () => ({
  useSessionStore: vi.fn(),
}));

const mockSessions = [
  { id: 's1', title: 'Chat 1', messages: [{ content: 'Hello', role: 'user' }], createdAt: Date.now(), updatedAt: Date.now() },
  { id: 's2', title: 'Chat 2', messages: [], createdAt: Date.now(), updatedAt: Date.now() },
];

const mockStore = {
  sessions: mockSessions,
  currentSessionId: 's1',
  createSession: vi.fn(),
  selectSession: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: any) => selector(mockStore));
});

describe('HistoryPanel', () => {
  it('renders session titles', () => {
    render(<HistoryPanel />);
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
  });

  it('calls createSession when New Chat clicked', () => {
    render(<HistoryPanel />);
    fireEvent.click(screen.getByText(/New Chat/i));
    expect(mockStore.createSession).toHaveBeenCalledOnce();
  });

  it('calls selectSession when a session is clicked', () => {
    render(<HistoryPanel />);
    fireEvent.click(screen.getByText('Chat 2'));
    expect(mockStore.selectSession).toHaveBeenCalledWith('s2');
  });

  it('marks the active session', () => {
    render(<HistoryPanel />);
    const active = screen.getByRole('button', { name: /Chat 1/i });
    expect(active).toHaveAttribute('aria-selected', 'true');
  });
});
