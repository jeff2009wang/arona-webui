import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatFrame } from '../ChatFrame';
import { useSessionStore } from '../../../stores/sessionStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useLLM } from '../../../hooks/useLLM';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

vi.mock('../FABDrawer', () => ({ FABDrawer: () => <div data-testid="fab-drawer" /> }));
vi.mock('../ChatHeader', () => ({ ChatHeader: (p: any) => <div data-testid="chat-header">{p.name}</div> }));
vi.mock('../ChatComposer', () => ({ ChatComposer: () => <div data-testid="chat-composer" /> }));
vi.mock('../AssistantBubble', () => ({ AssistantBubble: (p: any) => <div>{p.message.content}</div> }));
vi.mock('../UserBubble', () => ({ UserBubble: (p: any) => <div>{p.message.content}</div> }));
vi.mock('../ToolCard', () => ({ ToolCard: () => <div>tool</div> }));
vi.mock('../TypingIndicator', () => ({ TypingIndicator: () => <div>typing</div> }));

const mockSession = {
  id: 's1', title: 'Test', messages: [
    { id: 'm1', role: 'user', content: 'hi', createdAt: Date.now() },
    { id: 'm2', role: 'assistant', content: 'hello', createdAt: Date.now() },
  ], createdAt: Date.now(), updatedAt: Date.now(),
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((s: any) =>
    s({ sessions: [mockSession], currentSessionId: 's1', isStreaming: false })
  );
  vi.mocked(useSettingsStore).mockImplementation((s: any) =>
    s({ persona: 'arona', model: 'gpt-4o-mini' })
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: vi.fn() });
});

describe('ChatFrame', () => {
  it('renders chat header', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
  });

  it('renders FABDrawer', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('fab-drawer')).toBeInTheDocument();
  });

  it('renders chat composer', () => {
    render(<ChatFrame />);
    expect(screen.getByTestId('chat-composer')).toBeInTheDocument();
  });

  it('renders user and assistant messages', () => {
    render(<ChatFrame />);
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
