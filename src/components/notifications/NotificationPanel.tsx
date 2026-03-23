import { useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Package, Clock, Zap, Info } from 'lucide-react';
import { useNotificationStore, Notification } from '../../stores/notificationStore';
import { useAuthStore, useBusinessStore } from '../../stores/appStore';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const typeIcon: Record<string, any> = {
  low_stock: Package,
  reminder: Clock,
  payment_due: Zap,
  system: Info,
};

const typeColor: Record<string, string> = {
  low_stock: 'text-orange-500 bg-orange-500/10',
  reminder: 'text-blue-500 bg-blue-500/10',
  payment_due: 'text-red-500 bg-red-500/10',
  system: 'text-[#c8ee44] bg-[#c8ee44]/10',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, fetchNotifications, markAllRead, markRead } = useNotificationStore();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();

  useEffect(() => {
    if (open && user && business) fetchNotifications(user.id, business.id);
  }, [open]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-[340px] max-h-[480px] flex flex-col
      bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-white/10 
      rounded-2xl shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-neutral-600 dark:text-zinc-400" />
          <span className="font-semibold text-sm text-neutral-900 dark:text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#c8ee44] text-black text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => user && markAllRead(user.id)}
            className="flex items-center gap-1 text-xs text-[#8fb02e] dark:text-[#c8ee44] font-semibold">
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#c8ee44] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <Bell size={22} className="text-neutral-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-zinc-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcon[n.type] || Info;
            const color = typeColor[n.type] || typeColor.system;
            return (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-neutral-50 dark:hover:bg-white/3',
                  !n.read && 'bg-[#c8ee44]/5 dark:bg-[#c8ee44]/3'
                )}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', color)}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', n.read ? 'text-neutral-600 dark:text-zinc-400' : 'text-neutral-900 dark:text-white')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-neutral-400 dark:text-zinc-600 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#c8ee44] flex-shrink-0 mt-2" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}