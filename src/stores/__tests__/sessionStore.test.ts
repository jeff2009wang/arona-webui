import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessions: [],
      currentSessionId: null,
      isStreaming: false,
    });
  });

  it('creates a session and selects it', () => {
    const id = useSessionStore.getState().createSession();
    expect(useSessionStore.getState().currentSessionId).toBe(id);
    expect(useSessionStore.getState().sessions).toHaveLength(1);
  });

  it('renames a session', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().renameSession(id, 'Test Chat');
    expect(useSessionStore.getState().sessions[0].title).toBe('Test Chat');
  });

  it('adds a message', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    expect(useSessionStore.getState().sessions[0].messages).toHaveLength(1);
  });
});
