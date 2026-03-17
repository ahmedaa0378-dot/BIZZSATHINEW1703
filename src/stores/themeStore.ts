import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: () => boolean;
}

const getSystemDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
      isDark: () => {
        const t = get().theme;
        return t === 'dark' || (t === 'system' && getSystemDark());
      },
    }),
    { name: 'bizsaathi-theme' }
  )
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark = theme === 'dark' || (theme === 'system' && getSystemDark());
  root.classList.toggle('dark', dark);
}
