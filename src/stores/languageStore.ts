import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'gu';

interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'hi', label: 'हिंदी', shortLabel: 'हिं' },
  { code: 'te', label: 'తెలుగు', shortLabel: 'తె' },
  { code: 'ta', label: 'தமிழ்', shortLabel: 'த' },
  { code: 'gu', label: 'ગુજરાતી', shortLabel: 'ગુ' },
];

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  getLabel: () => string;
  getShortLabel: () => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      getLabel: () => LANGUAGES.find((l) => l.code === get().language)?.label ?? 'English',
      getShortLabel: () => LANGUAGES.find((l) => l.code === get().language)?.shortLabel ?? 'EN',
    }),
    { name: 'bizsaathi-lang' }
  )
);
