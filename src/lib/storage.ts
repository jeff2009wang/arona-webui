import type { StateStorage } from 'zustand/middleware';

export const localStorageAdapter: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};
