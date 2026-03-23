import { Bell, ChevronDown } from 'lucide-react';
import { useLanguageStore, languageNames, Language } from '../../stores/languageStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore, useBusinessStore } from '../../stores/appStore';
import { useState, useRef, useEffect } from 'react';
import NotificationPanel from '../notifications/NotificationPanel';

export function GlobalHeader() {
  const { language, languageLabel, setLanguage } = useLanguageStore();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();

  const languages: Language[] = ['en', 'hi', 'te', 'ta', 'gu'];

  useEffect(() => {
    if (user && business) fetchNotifications(user.id, business.id);
  }, [user, business]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
    }
    if (isLangOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
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
          <div className="relative" ref={langRef}>
            <button onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors">
              {languageLabel}
              <ChevronDown size={14} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
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
          <div className="relative" ref={notifRef}>
            <button onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <Bell size={20} className="text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#c8ee44] text-black text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel open={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </div>
      </div>
    </header>
  );
}