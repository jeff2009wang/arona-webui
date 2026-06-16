import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      currentSession: null,
      isStreaming: false,
    });
  });

  it('initializes with a single empty session', () => {
    // Re-create store state by directly setting a fresh empty session
    useSessionStore.getState().clearChat();
    const session = useSessionStore.getState().currentSession;
    expect(session).not.toBeNull();
    expect(session!.messages).toHaveLength(0);
    expect(session!.title).toBe('New Chat');
  });

  it('adds a message to the current session', () => {
    useSessionStore.getState().clearChat();
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    expect(useSessionStore.getState().currentSession!.messages).toHaveLength(1);
    expect(useSessionStore.getState().currentSession!.messages[0].content).toBe('hello');
  });

  it('updates a message by id', () => {
    useSessionStore.getState().clearChat();
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().updateMessage('m1', { content: 'updated' });
    expect(useSessionStore.getState().currentSession!.messages[0].content).toBe('updated');
  });

  it('deletes a message by id', () => {
    useSessionStore.getState().clearChat();
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().deleteMessage('m1');
    expect(useSessionStore.getState().currentSession!.messages).toHaveLength(0);
  });

  it('clearChat resets messages and changes session id', () => {
    useSessionStore.getState().clearChat();
    const firstId = useSessionStore.getState().currentSession!.id;
    useSessionStore.getState().addMessage({
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().clearChat();
    const secondId = useSessionStore.getState().currentSession!.id;
    expect(secondId).not.toBe(firstId);
    expect(useSessionStore.getState().currentSession!.messages).toHaveLength(0);
  });

  it('setStreaming toggles streaming flag', () => {
    useSessionStore.getState().setStreaming(true);
    expect(useSessionStore.getState().isStreaming).toBe(true);
    useSessionStore.getState().setStreaming(false);
    expect(useSessionStore.getState().isStreaming).toBe(false);
  });
});
