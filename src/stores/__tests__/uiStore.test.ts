import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().resetUI();
  });

  it('toggles history panel in both directions', () => {
    expect(useUIStore.getState().isHistoryOpen).toBe(true);
    useUIStore.getState().toggleHistory();
    expect(useUIStore.getState().isHistoryOpen).toBe(false);
    useUIStore.getState().toggleHistory();
    expect(useUIStore.getState().isHistoryOpen).toBe(true);
  });

  it('toggles actions panel', () => {
    expect(useUIStore.getState().isActionsOpen).toBe(true);
    useUIStore.getState().toggleActions();
    expect(useUIStore.getState().isActionsOpen).toBe(false);
  });

  it('sets active mobile tab', () => {
    useUIStore.getState().setActiveMobileTab('history');
    expect(useUIStore.getState().activeMobileTab).toBe('history');
  });

  it('opens and closes settings', () => {
    useUIStore.getState().openSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(true);
    useUIStore.getState().closeSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(false);
  });
});
