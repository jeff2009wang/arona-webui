import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { localStorageAdapter } from '../lib/storage';

export interface SettingsState extends Settings {
  updateConfig: (config: Partial<Settings>) => void;
  setPersona: (persona: Settings['persona']) => void;
  resetToDefaults: () => void;
}

const defaultSettings: Settings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '你是一个 helpful 的 AI 助手。',
  persona: 'arona',
  enableCgBackground: true,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateConfig: (config) => set((state) => ({ ...state, ...config })),
      setPersona: (persona) => set({ persona }),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'arona-settings',
      storage: localStorageAdapter as any,
    }
  )
);
