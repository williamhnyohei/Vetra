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
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (updates) => {
        set((state) => ({
          ...state,
          ...updates,
        }));
        // Mirror to chrome.storage for background SW
        try {
          const next = { ...get(), ...updates };
          const payload = {
            riskThreshold: next.riskThreshold,
            autoBlockHighRisk: next.autoBlockHighRisk,
            showAttestations: next.showAttestations,
            rpcEndpoint: next.rpcEndpoint,
            network: next.network,
            notifications: next.notifications,
            openaiApiKey: next.openaiApiKey,
            openaiEnrichment: next.openaiEnrichment,
          };
          chrome.storage?.local?.set({ vetraSettings: payload });
        } catch {
          /* ignore outside extension */
        }
      },

      resetSettings: () => {
        set(() => ({
          ...DEFAULT_SETTINGS,
        }));
        try {
          chrome.storage?.local?.set({ vetraSettings: DEFAULT_SETTINGS });
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: 'vetra-settings',
    }
  )
);

