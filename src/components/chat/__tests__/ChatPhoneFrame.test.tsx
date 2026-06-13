import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatPhoneFrame } from '../ChatPhoneFrame';
import { useSessionStore } from '../../../stores/sessionStore';
import { useSettingsStore } from '../../../stores/settingsStore';

// Mock the useLLM hook
vi.mock('../../../hooks/useLLM', () => ({
  useLLM: () => ({
    sendMessage: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock child components to isolate ChatPhoneFrame testing
vi.mock('../ChatHeader', () => ({
  ChatHeader: ({ name, status, avatar }: { name: string; status: string; avatar: string }) => (
    <div data-testid="chat-header">
      <span data-testid="header-name">{name}</span>
      <span data-testid="header-status">{status}</span>
      <span data-testid="header-avatar">{avatar}</span>
    </div>
  ),
}));

vi.mock('../AssistantBubble', () => ({
  AssistantBubble: ({ message }: { message: { id: string; content: string } }) => (
    <div data-testid="assistant-bubble">{message.content}</div>
  ),
}));

vi.mock('../UserBubble', () => ({
  UserBubble: ({ message }: { message: { id: string; content: string } }) => (
    <div data-testid="user-bubble">{message.content}</div>
  ),
}));

vi.mock('../ToolCard', () => ({
  ToolCard: ({ toolCall }: { toolCall: { id: string; name: string } }) => (
    <div data-testid="tool-card">{toolCall.name}</div>
  ),
}));

vi.mock('../TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">typing...</div>,
}));

vi.mock('../ChatComposer', () => ({
  ChatComposer: ({ onSend, disabled }: { onSend: (v: string) => void; disabled?: boolean }) => (
    <div data-testid="chat-composer">
      <button
        data-testid="mock-send"
        disabled={disabled}
        onClick={() => onSend('test message')}
      >
        Send
      </button>
    </div>
  ),
}));

describe('ChatPhoneFrame', () => {
  beforeEach(() => {
    // Reset stores to a clean state
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });
    useSettingsStore.setState({
      persona: 'arona',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chat phone frame when a session exists', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({ currentSessionId: sessionId });

    render(<ChatPhoneFrame />);

    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });

  it('renders with Arona persona by default', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({ currentSessionId: sessionId });

    render(<ChatPhoneFrame />);

    expect(screen.getByTestId('header-name')).toHaveTextContent('Arona');
    expect(screen.getByTestId('header-status')).toHaveTextContent('Online · Schale Terminal');
    expect(screen.getByTestId('header-avatar')).toHaveTextContent('🎓');
  });

  it('renders with Plana persona when set', () => {
    useSettingsStore.setState({ persona: 'plana' });
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({ currentSessionId: sessionId });

    render(<ChatPhoneFrame />);

    expect(screen.getByTestId('header-name')).toHaveTextContent('Plana');
    expect(screen.getByTestId('header-status')).toHaveTextContent('Online · Aria Terminal');
    expect(screen.getByTestId('header-avatar')).toHaveTextContent('🌙');
  });

  it('renders messages from the session', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({
      currentSessionId: sessionId,
      sessions: [
        {
          id: sessionId,
          title: 'Test Chat',
          messages: [
            { id: 'msg-1', role: 'user', content: 'Hello', createdAt: Date.now() },
            { id: 'msg-2', role: 'assistant', content: 'Hi there!', createdAt: Date.now() },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

    render(<ChatPhoneFrame />);

    expect(screen.getByTestId('user-bubble')).toHaveTextContent('Hello');
    expect(screen.getByTestId('assistant-bubble')).toHaveTextContent('Hi there!');
  });

  it('shows typing indicator when streaming', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({
      currentSessionId: sessionId,
      isStreaming: true,
    });

    render(<ChatPhoneFrame />);

    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('renders tool messages with tool cards', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({
      currentSessionId: sessionId,
      sessions: [
        {
          id: sessionId,
          title: 'Test Chat',
          messages: [
            {
              id: 'msg-tool',
              role: 'tool',
              content: '',
              createdAt: Date.now(),
              toolCalls: [
                {
                  id: 'tc-1',
                  name: 'search_web',
                  arguments: { query: 'BA' },
                  status: 'success',
                  startedAt: Date.now(),
                  finishedAt: Date.now(),
                },
              ],
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    });

        render(<ChatPhoneFrame />);
        expect(screen.getByTestId('tool-card')).toHaveTextContent('search_web');
    });

  it('does not show typing indicator when not streaming', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({
      currentSessionId: sessionId,
      isStreaming: false,
    });

    render(<ChatPhoneFrame />);

    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('disables composer when streaming', () => {
    const sessionId = useSessionStore.getState().createSession();
    useSessionStore.setState({
      currentSessionId: sessionId,
      isStreaming: true,
    });

    render(<ChatPhoneFrame />);

    expect(screen.getByTestId('mock-send')).toBeDisabled();
  });
});
