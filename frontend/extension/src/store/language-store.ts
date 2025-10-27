import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'pt';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en', // Default to English
      setLanguage: (language: Language) => {
        console.log(`🌐 Language changed to: ${language}`);
        set({ language });
      },
    }),
    {
      name: 'vetra-language',
    }
  )
);

