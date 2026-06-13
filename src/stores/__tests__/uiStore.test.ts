import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      isHistoryOpen: true,
      isActionsOpen: true,
      activeMobileTab: 'chat',
      isSettingsOpen: false,
    });
  });

  it('toggles history panel', () => {
    useUIStore.getState().toggleHistory();
    expect(useUIStore.getState().isHistoryOpen).toBe(false);
  });

  it('opens and closes settings', () => {
    useUIStore.getState().openSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(true);
    useUIStore.getState().closeSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(false);
  });
});
