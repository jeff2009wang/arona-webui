import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import type { Settings } from '../types';
import { localStorageAdapter } from '../lib/storage';

export interface SettingsState extends Settings {
  updateConfig: (config: Partial<Settings>) => void;
  setPersona: (persona: Settings['persona']) => void;
  resetToDefaults: () => void;
  clearAllData: () => void;
}

const defaultSettings: Settings = {
  baseUrl: 'http://192.168.122.152:8642/v1',
  apiKey: '459478cd003576fb8e7ee2888e5704bfbd81f231f7a229709644fec0e36c81b4',
  model: 'hermes-agent',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '你是一个 helpful 的 AI 助手。',
  persona: 'arona',
  enableCgBackground: true,
  backgroundOpacity: 0.75,
  backgroundBlur: 0,
  streamEnabled: true,
  localBackgroundPath: '',
  localAvatarPath: '',
  autoSummarize: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateConfig: (config) => set((state) => ({ ...state, ...config })),
      setPersona: (persona) => set({ persona }),
      resetToDefaults: () => set(defaultSettings),
      clearAllData: () => {
        if (window.confirm('确定要清除所有数据吗？此操作不可撤销。')) {
          localStorage.removeItem('arona-settings');
          window.location.reload();
        }
      },
    }),
    {
      name: 'arona-settings',
      version: 1,
      storage: localStorageAdapter as unknown as PersistStorage<SettingsState>,
      // v0→v1: migrate users who still had the OpenAI placeholder defaults
      // to the local hermesagent endpoint so they can actually send messages.
      migrate: (persistedState: unknown) => {
        const persisted = persistedState as Record<string, unknown>;
        // v0→v1: migrate users who still had the OpenAI placeholder defaults
        // to the local hermesagent endpoint so they can actually send messages.
        if (
          persisted.baseUrl === 'https://api.openai.com/v1' &&
          persisted.apiKey === '' &&
          persisted.model === 'gpt-4o-mini'
        ) {
          return {
            ...persisted,
            baseUrl: defaultSettings.baseUrl,
            apiKey: defaultSettings.apiKey,
            model: defaultSettings.model,
          } as unknown as SettingsState;
        }
        return persisted as unknown as SettingsState;
      },
    }
  )
);
