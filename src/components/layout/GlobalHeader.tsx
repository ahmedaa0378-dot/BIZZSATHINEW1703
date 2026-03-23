import { Bell, ChevronDown, X, Info } from 'lucide-react';
import { useLanguageStore, languageNames, Language } from '../../stores/languageStore';
import { useState, useRef, useEffect } from 'react';

export function GlobalHeader() {
  const { language, languageLabel, setLanguage } = useLanguageStore();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = ['en', 'hi', 'te', 'ta', 'gu'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 overflow-visible">
      <div className="max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c8ee44] to-[#a3c428] flex items-center justify-center">
            <span className="text-black text-sm font-bold">BS</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">BizzSathi</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative z-[60]" ref={langRef}>
            <button onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
              {languageLabel}
              <ChevronDown size={14} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-[60]">
                {languages.map((lang) => (
                  <button key={lang} onClick={() => { setLanguage(lang); setIsLangOpen(false); }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                      language === lang ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    {languageNames[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bell icon */}
          <div className="relative z-[60]" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <Bell size={20} className="text-gray-700 dark:text-gray-300" />
            </button>

            {/* Notification Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[300px] bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-neutral-500 dark:text-zinc-400" />
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white">Notifications</span>
                  </div>
                  <button onClick={() => setIsNotifOpen(false)}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    <X size={15} className="text-neutral-400 dark:text-zinc-500" />
                  </button>
                </div>

                {/* Empty state */}
                <div className="flex flex-col items-center justify-center py-10 gap-3 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                    <Info size={20} className="text-neutral-400 dark:text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-zinc-500 text-center">
                    No notifications yet
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-zinc-600 text-center">
                    Low stock alerts, payment reminders and daily summaries will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
