import { Bell, ChevronDown } from 'lucide-react';
import { useLanguageStore, languageNames, Language } from '../../stores/languageStore';
import { useState, useRef, useEffect } from 'react';

export function GlobalHeader() {
  const { language, languageLabel, setLanguage } = useLanguageStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const languages: Language[] = ['en', 'hi', 'te', 'ta', 'gu'];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
      <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">BS</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            BizzSathi
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
            >
              {languageLabel}
              <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                      language === lang
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {languageNames[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <Bell size={20} className="text-gray-700 dark:text-gray-300" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#c8ee44] rounded-full"></div>
          </button>
        </div>
      </div>
    </header>
  );
}
