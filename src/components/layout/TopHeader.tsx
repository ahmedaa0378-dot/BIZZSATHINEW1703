import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, X, AlertTriangle, Package, FileText, Clock, Sparkles, CheckCheck } from 'lucide-react';
import { useLanguageStore, LANGUAGES } from '../../stores/languageStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore, useBusinessStore } from '../../stores/appStore';
import { useAlerts, Alert } from '../../hooks/useAlerts';
import { useNavigate } from 'react-router-dom';

function AlertIcon({ type }: { type: string }) {
  switch (type) {
    case 'trial': return <AlertTriangle size={16} className="text-amber-500" />;
    case 'overdue': return <FileText size={16} className="text-red-500" />;
    case 'low_stock': return <Package size={16} className="text-orange-500" />;
    case 'reminder': return <Clock size={16} className="text-purple-500" />;
    default: return <Sparkles size={16} className="text-blue-500" />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function TopHeader() {
  const { language, setLanguage, getShortLabel } = useLanguageStore();
  const { notifications, unreadCount, fetchNotifications, markAllRead } = useNotificationStore();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();
  const alerts = useAlerts();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch stored notifications on mount
  useEffect(() => {
    if (user?.id && business?.id) {
      fetchNotifications(user.id, business.id);
    }
  }, [user?.id, business?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    function close(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Combine: live alerts + stored notifications
  const allItems = [
    ...alerts.map(a => ({ ...a, source: 'alert' as const })),
    ...notifications.map(n => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      action_url: n.action_url,
      created_at: n.created_at,
      read: n.read,
      source: 'stored' as const,
    })),
  ];

  const totalUnread = alerts.length + unreadCount;

  const handleItemClick = (item: typeof allItems[0]) => {
    if (item.action_url) {
      navigate(item.action_url);
      setNotifOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    if (user?.id) markAllRead(user.id);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]
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
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center
                rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-white dark:bg-[#0f0f0f]
              border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-neutral-500 dark:text-zinc-400" />
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">Notifications</span>
                  {totalUnread > 0 && (
                    <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                      title="Mark all read">
                      <CheckCheck size={14} className="text-neutral-400 dark:text-zinc-500" />
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    <X size={14} className="text-neutral-400 dark:text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto">
                {allItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                      <Bell size={20} className="text-neutral-300 dark:text-zinc-700" />
                    </div>
                    <p className="text-sm font-medium text-neutral-400 dark:text-zinc-600">All clear!</p>
                    <p className="text-xs text-neutral-300 dark:text-zinc-700 text-center">Alerts for low stock, overdue invoices & reminders will show here</p>
                  </div>
                ) : (
                  allItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                        hover:bg-neutral-50 dark:hover:bg-white/5 border-b border-neutral-50 dark:border-white/3
                        ${item.source === 'stored' && (item as any).read ? 'opacity-50' : ''}`}
                    >
                      <div className="mt-0.5 w-8 h-8 rounded-xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        <AlertIcon type={item.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{item.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-zinc-500 line-clamp-2">{item.body}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-zinc-600 mt-1">{timeAgo(item.created_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}