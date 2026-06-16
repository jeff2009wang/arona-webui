import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('has default values', () => {
    const state = useSettingsStore.getState();
    expect(state.baseUrl).toBe('http://192.168.122.152:8642/v1');
    expect(state.persona).toBe('arona');
  });

  it('updates config', () => {
    useSettingsStore.getState().updateConfig({ temperature: 0.5 });
    expect(useSettingsStore.getState().temperature).toBe(0.5);
  });

  it('changes persona', () => {
    useSettingsStore.getState().setPersona('plana');
    expect(useSettingsStore.getState().persona).toBe('plana');
  });
});
