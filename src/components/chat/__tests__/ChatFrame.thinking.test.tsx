import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatFrame } from '../ChatFrame';
import { useSessionStore } from '../../../stores/sessionStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useLLM } from '../../../hooks/useLLM';
import type { SessionState } from '../../../stores/sessionStore';
import type { SettingsState } from '../../../stores/settingsStore';
import type { Session } from '../../../types';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

vi.mock('../FABDrawer', () => ({ FABDrawer: () => <div data-testid="fab-drawer" /> }));
vi.mock('../ChatHeader', () => ({
  ChatHeader: (p: { name: string }) => <div data-testid="chat-header">{p.name}</div>,
}));
vi.mock('../ChatComposer', () => ({ ChatComposer: () => <div data-testid="chat-composer" /> }));
vi.mock('../EmptyChatState', () => ({ EmptyChatState: () => <div data-testid="empty-state" /> }));
vi.mock('../AnimatedMessage', () => ({
  AnimatedMessage: (p: { message: { id: string; role: string; content: string } }) => (
    <div data-testid={`message-${p.message.id}`}>
      {p.message.role}:{p.message.content}
    </div>
  ),
}));
vi.mock('../ThinkingBubble', () => ({
  ThinkingBubble: (p: { reasoning?: string }) => (
    <div data-testid="thinking-bubble">{p.reasoning ? `thinking:${p.reasoning}` : 'thinking'}</div>
  ),
}));
vi.mock('../TypingIndicator', () => ({ TypingIndicator: () => <div data-testid="typing-indicator">typing</div> }));

const baseAssistant = { id: 'm2', role: 'assistant' as const, content: '', createdAt: Date.now() };
const mockSession: Session = {
  id: 's1',
  title: 'Test',
  summary: 'Test summary',
  messages: [
    { id: 'm1', role: 'user' as const, content: 'hi', createdAt: Date.now() },
    baseAssistant,
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  titleGenerated: true,
  summaryGenerated: true,
};

const mockSettingsStore: Pick<SettingsState, 'persona' | 'model'> = {
  persona: 'arona',
  model: 'gpt-4o-mini',
};

const mockSessionStoreStreaming: Pick<SessionState, 'currentSession' | 'isStreaming'> = {
  currentSession: mockSession,
  isStreaming: true,
};

describe('ChatFrame thinking state', () => {
  beforeEach(() => {
    vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
      selector(mockSessionStoreStreaming as SessionState)
    );
    vi.mocked(useSettingsStore).mockImplementation((selector: (state: SettingsState) => unknown) =>
      selector(mockSettingsStore as SettingsState)
    );
    vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: vi.fn() });
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a single ThinkingBubble while assistant message is empty and streaming', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('thinking-bubble')).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).toBeNull();
    expect(screen.queryByTestId(`message-${baseAssistant.id}`)).toBeNull();
  });

  it('surfaces reasoning inside the same ThinkingBubble', () => {
    const sessionWithReasoning: Session = {
      ...mockSession,
      messages: [
        mockSession.messages[0],
        { ...baseAssistant, reasoning: 'step one' },
      ],
    };
    vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
      selector({ ...mockSessionStoreStreaming, currentSession: sessionWithReasoning } as SessionState)
    );
    render(<ChatFrame />);
    expect(screen.getByText('thinking:step one')).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).toBeNull();
    expect(screen.queryByTestId(`message-${baseAssistant.id}`)).toBeNull();
  });

  it('renders the assistant message normally once content arrives', () => {
    const sessionWithContent: Session = {
      ...mockSession,
      messages: [
        mockSession.messages[0],
        { ...baseAssistant, content: 'hello' },
      ],
    };
    vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
      selector({ ...mockSessionStoreStreaming, currentSession: sessionWithContent } as SessionState)
    );
    render(<ChatFrame />);
    expect(screen.getByTestId(`message-${baseAssistant.id}`)).toHaveTextContent('assistant:hello');
    expect(screen.queryByTestId('thinking-bubble')).toBeNull();
    expect(screen.queryByTestId('typing-indicator')).toBeNull();
  });
});
