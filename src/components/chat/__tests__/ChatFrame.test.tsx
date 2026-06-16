import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatFrame } from '../ChatFrame';
import { useSessionStore } from '../../../stores/sessionStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useLLM } from '../../../hooks/useLLM';
import type { SessionState } from '../../../stores/sessionStore';
import type { SettingsState } from '../../../stores/settingsStore';

vi.mock('../../../stores/sessionStore', () => ({ useSessionStore: vi.fn() }));
vi.mock('../../../stores/settingsStore', () => ({ useSettingsStore: vi.fn() }));
vi.mock('../../../hooks/useLLM', () => ({ useLLM: vi.fn() }));

vi.mock('../FABDrawer', () => ({ FABDrawer: () => <div data-testid="fab-drawer" /> }));
vi.mock('../ChatHeader', () => ({ ChatHeader: (p: { name: string }) => <div data-testid="chat-header">{p.name}</div> }));
vi.mock('../ChatComposer', () => ({ ChatComposer: () => <div data-testid="chat-composer" /> }));
vi.mock('../UserBubble', () => ({ UserBubble: (p: { message: { content: string } }) => <div>{p.message.content}</div> }));
vi.mock('../ToolActivityGroup', () => ({ ToolActivityGroup: () => <div data-testid="tool-activity-group"></div> }));
vi.mock('../TypingIndicator', () => ({ TypingIndicator: () => <div>typing</div> }));

const mockSession = {
  id: 's1', title: 'Test', summary: 'Test summary', messages: [
    { id: 'm1', role: 'user' as const, content: 'hi', createdAt: Date.now() },
    { id: 'm2', role: 'assistant' as const, content: 'hello', createdAt: Date.now() },
  ], createdAt: Date.now(), updatedAt: Date.now(), titleGenerated: true, summaryGenerated: true,
};

const mockSessionStore: Pick<SessionState, 'currentSession' | 'isStreaming'> = {
  currentSession: mockSession,
  isStreaming: false,
};

const mockSettingsStore = {
  persona: 'arona' as const,
  model: 'gpt-4o-mini',
};

beforeEach(() => {
  vi.mocked(useSessionStore).mockImplementation((selector: (state: SessionState) => unknown) =>
    selector(mockSessionStore as SessionState)
  );
  vi.mocked(useSettingsStore).mockImplementation((selector: (state: SettingsState) => unknown) =>
    selector(mockSettingsStore as SettingsState)
  );
  vi.mocked(useLLM).mockReturnValue({ sendMessage: vi.fn(), stop: vi.fn() });
});

afterEach(() => {
  cleanup();
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
