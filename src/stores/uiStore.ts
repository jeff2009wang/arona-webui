import { create } from 'zustand';

type MobileTab = 'chat' | 'history' | 'tools' | 'settings';

export interface UIState {
  isHistoryOpen: boolean;
  isActionsOpen: boolean;
  activeMobileTab: MobileTab;
  isSettingsOpen: boolean;
  toggleHistory: () => void;
  toggleActions: () => void;
  setActiveMobileTab: (tab: MobileTab) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isHistoryOpen: true,
  isActionsOpen: true,
  activeMobileTab: 'chat',
  isSettingsOpen: false,
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
  toggleActions: () => set((state) => ({ isActionsOpen: !state.isActionsOpen })),
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));
