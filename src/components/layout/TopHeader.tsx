import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useLanguageStore, LANGUAGES } from '../../stores/languageStore';

export default function TopHeader() {
  const { language, setLanguage, getShortLabel } = useLanguageStore();
  const [langOpen, setLangOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14
      bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
      dark:bg-black/80 dark:backdrop-blur-xl dark:border-white/5">
      {/* Logo Text */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Biz<span className="text-[#8fb02e] dark:text-[#c8ee44]">Saathi</span>
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Language Picker */}
        <div className="relative" ref={dropRef}>
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
              animate-fade-in z-50">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
                    hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors
                    ${language === l.code ? 'text-[#8fb02e] dark:text-[#c8ee44] font-semibold' : 'text-neutral-700 dark:text-zinc-300'}`}
                >
                  {l.label}
                  {language === l.code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c8ee44]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
          <Bell size={20} className="text-neutral-600 dark:text-zinc-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c8ee44]" />
        </button>
      </div>
    </header>
  );
}