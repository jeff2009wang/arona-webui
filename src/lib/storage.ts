import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const rawStorage: StateStorage = {
  getItem: (name): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  },
  removeItem: (name): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const localStorageAdapter = createJSONStorage(() => rawStorage) as unknown as StateStorage;
