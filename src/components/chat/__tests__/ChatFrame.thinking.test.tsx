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
  AnimatedMessage: (p: { message: { id: string; role: string; content: string | import('../../../types').MessageNode[] } }) => {
    const contentStr = Array.isArray(p.message.content)
      ? p.message.content.map((n: import('../../../types').MessageNode) => (n.type === 'text' ? (n as import('../../../types').TextNode).content : '')).join('')
      : p.message.content;
    return (
      <div data-testid={`message-${p.message.id}`}>
        {p.message.role}:{contentStr}
      </div>
    );
  },
}));
vi.mock('../ThinkingBubble', () => ({
  ThinkingBubble: (p: { reasoning?: string }) => (
    <div data-testid="thinking-bubble">{p.reasoning ? `thinking:${p.reasoning}` : 'thinking'}</div>
  ),
}));
vi.mock('../TypingIndicator', () => ({ TypingIndicator: () => <div data-testid="typing-indicator">typing</div> }));

vi.mock('../ToolActivityGroup', () => ({
  ToolActivityGroup: () => <div data-testid="tool-activity-group">tools</div>,
}));

const baseAssistant = { id: 'm2', role: 'assistant' as const, content: [] as import('../../../types').MessageNode[], createdAt: Date.now() };
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

  it('renders the assistant message even when empty and streaming', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId(`message-${baseAssistant.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).toBeNull();
  });

  it('renders the assistant message with reasoning nodes', () => {
    const sessionWithReasoning: Session = {
      ...mockSession,
      messages: [
        mockSession.messages[0],
        { ...baseAssistant, content: [{ type: 'reasoning', content: 'step one' }] },
      ],
    };
    vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
      selector({ ...mockSessionStoreStreaming, currentSession: sessionWithReasoning } as SessionState)
    );
    render(<ChatFrame />);
    expect(screen.getByTestId(`message-${baseAssistant.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).toBeNull();
  });

  it('renders the assistant message normally once content arrives', () => {
    const sessionWithContent: Session = {
      ...mockSession,
      messages: [
        mockSession.messages[0],
        { ...baseAssistant, content: [{ type: 'text', content: 'hello' }] },
      ],
    };
    vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
      selector({ ...mockSessionStoreStreaming, currentSession: sessionWithContent } as SessionState)
    );
    render(<ChatFrame />);
    expect(screen.getByTestId(`message-${baseAssistant.id}`)).toHaveTextContent('assistant:hello');
    expect(screen.queryByTestId('typing-indicator')).toBeNull();
  });

  it('renders assistant message with reasoning and tool nodes', () => {
    const sessionWithTool: Session = {
      ...mockSession,
      messages: [
        mockSession.messages[0],
        {
          ...baseAssistant,
          content: [
            { type: 'reasoning', content: 'thinking...' },
            { type: 'tool_call', id: 'tc1', name: 'web_search', arguments: { query: 'test' }, status: 'running' as const, startedAt: Date.now() },
          ],
        },
      ],
    };
    vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
      selector({ ...mockSessionStoreStreaming, currentSession: sessionWithTool } as SessionState)
    );
    render(<ChatFrame />);
    expect(screen.getByTestId(`message-${baseAssistant.id}`)).toHaveTextContent('assistant:');
    expect(screen.queryByTestId('tool-activity-group')).toBeNull();
  });
});
