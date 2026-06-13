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

  it('deletes current session and falls back to next session', () => {
    const id1 = useSessionStore.getState().createSession();
    const id2 = useSessionStore.getState().createSession();
    useSessionStore.getState().createSession();

    useSessionStore.getState().selectSession(id2);
    useSessionStore.getState().deleteSession(id2);

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(2);
    expect(state.currentSessionId).toBe(id1);
  });

  it('deletes non-current session without changing currentSessionId', () => {
    const id1 = useSessionStore.getState().createSession();
    const id2 = useSessionStore.getState().createSession();

    useSessionStore.getState().selectSession(id1);
    useSessionStore.getState().deleteSession(id2);

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.currentSessionId).toBe(id1);
  });

  it('updates a message', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().updateMessage(id, 'm1', { content: 'updated' });
    expect(useSessionStore.getState().sessions[0].messages[0].content).toBe('updated');
  });

  it('clears a session', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });
    useSessionStore.getState().renameSession(id, 'Renamed');
    useSessionStore.getState().clearSession(id);

    const session = useSessionStore.getState().sessions[0];
    expect(session.messages).toHaveLength(0);
    expect(session.title).toBe('New Chat');
  });

  it('exports and imports sessions', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().renameSession(id, 'Export Chat');
    useSessionStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'hello',
      createdAt: Date.now(),
    });

    const exported = useSessionStore.getState().exportSessions();

    useSessionStore.setState({ sessions: [], currentSessionId: null });
    useSessionStore.getState().importSessions(exported);

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].title).toBe('Export Chat');
    expect(state.sessions[0].messages).toHaveLength(1);
    expect(state.currentSessionId).toBe(state.sessions[0].id);
  });

  it('importSessions ignores invalid data', () => {
    const payload = JSON.stringify({
      sessions: [
        { id: 'valid', title: 'Valid', messages: [], createdAt: 1, updatedAt: 2 },
        { id: 'invalid', title: 'Invalid' },
      ],
    });

    useSessionStore.getState().importSessions(payload);

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe('valid');
  });

  it('importSessions handles invalid JSON gracefully', () => {
    useSessionStore.getState().importSessions('not json');
    expect(useSessionStore.getState().sessions).toHaveLength(0);
  });

  it('selectSession changes current session', () => {
    const id1 = useSessionStore.getState().createSession();
    const id2 = useSessionStore.getState().createSession();

    useSessionStore.getState().selectSession(id1);
    expect(useSessionStore.getState().currentSessionId).toBe(id1);

    useSessionStore.getState().selectSession(id2);
    expect(useSessionStore.getState().currentSessionId).toBe(id2);
  });

  it('setStreaming toggles streaming flag', () => {
    useSessionStore.getState().setStreaming(true);
    expect(useSessionStore.getState().isStreaming).toBe(true);

    useSessionStore.getState().setStreaming(false);
    expect(useSessionStore.getState().isStreaming).toBe(false);
  });

  it('addMessage auto-titles session on first user message', () => {
    const id = useSessionStore.getState().createSession();
    useSessionStore.getState().addMessage(id, {
      id: 'm1',
      role: 'user',
      content: 'This is a long user message that should be truncated',
      createdAt: Date.now(),
    });

    const session = useSessionStore.getState().sessions[0];
    expect(session.title).toBe('This is a long user message th');
  });
});
