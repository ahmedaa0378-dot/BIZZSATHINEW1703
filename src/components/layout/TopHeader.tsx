import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, X, Info } from 'lucide-react';
import { useLanguageStore, LANGUAGES } from '../../stores/languageStore';

export default function TopHeader() {
  const { language, setLanguage, getShortLabel } = useLanguageStore();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14
      bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
      dark:bg-black/80 dark:backdrop-blur-xl dark:border-white/5 overflow-visible">

      {/* Logo */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Biz<span className="text-[#8fb02e] dark:text-[#c8ee44]">Saathi</span>
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">

        {/* Language Picker */}
        <div className="relative z-[60]" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold
              bg-neutral-100 text-neutral-700 hover:bg-neutral-200
              dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15
              transition-colors border border-neutral-200 dark:border-white/10"
          >
            {getShortLabel()}
            <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>

          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl overflow-hidden
              bg-white border border-neutral-200 shadow-lg
              dark:bg-neutral-900 dark:border-white/10
              animate-fade-in z-[60]">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
                    hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors
                    ${language === l.code ? 'text-[#8fb02e] dark:text-[#c8ee44] font-semibold' : 'text-neutral-700 dark:text-zinc-300'}`}
                >
                  {l.label}
                  {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-[#c8ee44]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative z-[60]" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          >
            <Bell size={20} className="text-neutral-600 dark:text-zinc-400" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[300px] bg-white dark:bg-[#0f0f0f]
              border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-neutral-500 dark:text-zinc-400" />
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">Notifications</span>
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
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
    </header>
  );
}
