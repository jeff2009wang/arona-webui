import type { StateStorage } from 'zustand/middleware';

export const localStorageAdapter: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded)
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      // localStorage may be unavailable (private mode, quota exceeded)
      console.warn('Failed to persist state:', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // localStorage may be unavailable (private mode, quota exceeded)
    }
  },
};
