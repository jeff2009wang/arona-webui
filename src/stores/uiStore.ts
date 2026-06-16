import { create } from 'zustand';

type MobileTab = 'chat' | 'settings';

export interface UIState {
  activeMobileTab: MobileTab;
  isSettingsOpen: boolean;
  setActiveMobileTab: (tab: MobileTab) => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetUI: () => void;
}

const initialState = {
  activeMobileTab: 'chat' as MobileTab,
  isSettingsOpen: false,
};

export const useUIStore = create<UIState>()((set) => ({
  ...initialState,
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  resetUI: () => set(initialState),
}));
