import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().resetUI();
  });

  it('sets active mobile tab', () => {
    useUIStore.getState().setActiveMobileTab('settings');
    expect(useUIStore.getState().activeMobileTab).toBe('settings');
  });

  it('opens and closes settings', () => {
    useUIStore.getState().openSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(true);
    useUIStore.getState().closeSettings();
    expect(useUIStore.getState().isSettingsOpen).toBe(false);
  });
});
