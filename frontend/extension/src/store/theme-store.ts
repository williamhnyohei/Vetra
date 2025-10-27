import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  applyTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark', // Default to dark
      
      setTheme: (theme: Theme) => {
        set({ theme });
        get().applyTheme(theme);
      },
      
      applyTheme: (theme: Theme) => {
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.body.style.backgroundColor = '#FFFFFF';
          document.body.style.color = '#000000';
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
          document.body.style.backgroundColor = '#121212';
          document.body.style.color = '#E6E6E6';
        }
      },
    }),
    {
      name: 'vetra-theme',
    }
  )
);

