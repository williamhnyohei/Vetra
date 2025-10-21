import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends Settings {
  // Actions
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
        })),

      resetSettings: () =>
        set(() => ({
          ...DEFAULT_SETTINGS,
        })),
    }),
    {
      name: 'vetra-settings',
    }
  )
);

