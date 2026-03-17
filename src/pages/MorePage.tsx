import {
  Building2, CreditCard, FileText, Bell, Sun, Moon,
  HelpCircle, Info, LogOut, ChevronRight, Sparkles,
  Users, BarChart3, Megaphone, MapPin, MessageCircle,
  Crown, Shield, Zap, UserPlus,
} from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore, useBusinessStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface MenuItem {
  icon: typeof Building2;
  label: string;
  rightText?: string;
  danger?: boolean;
  action?: () => void;
}

export default function MorePage() {
  const { theme, setTheme, isDark } = useThemeStore();
  const { logout } = useAuthStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/auth');
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'BUSINESS',
      items: [
        { icon: Users, label: 'Contacts', action: () => navigate('/contacts') },
        { icon: BarChart3, label: 'Reports', action: () => navigate('/reports') },
        { icon: Zap, label: 'AI Insights', action: () => navigate('/insights') },
        { icon: Building2, label: 'Business Profile', action: () => navigate('/settings/business') },
        { icon: CreditCard, label: 'Payment Methods', action: () => navigate('/settings/payment-methods') },
        { icon: FileText, label: 'Invoice Settings', action: () => navigate('/settings/invoice') },
      ],
    },
    {
      title: 'TOOLS',
      items: [
        { icon: Megaphone, label: 'Marketing Suite', action: () => navigate('/marketing') },
        { icon: MapPin, label: 'Find Distributors', action: () => navigate('/distributors') },
        { icon: MessageCircle, label: 'WhatsApp', action: () => navigate('/whatsapp') },
        { icon: CreditCard, label: 'Payments & Collections', action: () => navigate('/payments') },
      ],
    },
    {
      title: 'TEAM & PLAN',
      items: [
        { icon: UserPlus, label: 'Team Members', action: () => navigate('/team') },
        { icon: Crown, label: 'Subscription', action: () => navigate('/subscription') },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { icon: Bell, label: 'Preferences', action: () => navigate('/settings/preferences') },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: HelpCircle, label: 'Help & Support' },
        { icon: Info, label: 'About BizzSathi', rightText: 'v1.0.0' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { icon: LogOut, label: 'Logout', danger: true, action: handleLogout },
      ],
    },
  ];

  return (
    <div className="px-4 pt-3 pb-4 space-y-5 animate-fade-in">
      {/* Profile Hero Card */}
      <div className="premium-card p-5">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c8ee44] to-[#a3c428] 
            flex items-center justify-center shadow-glow-green flex-shrink-0">
            <span className="text-black text-lg font-bold">
              {(business?.ownerName || 'AK').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{business?.ownerName || 'Ahmed Khan'}</p>
            <p className="text-sm text-neutral-500 dark:text-zinc-400">{business?.name || 'Khan General Store'}</p>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 px-3 py-2 rounded-xl 
          bg-accent/10 dark:bg-accent/10 border border-accent/20">
          <Sparkles size={14} className="text-accent-dark dark:text-accent" />
          <span className="text-xs font-semibold text-accent-dark dark:text-accent">
            Pro Trial — 5 days left
          </span>
        </div>
      </div>

      {/* Theme Toggle Card */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark() ? (
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Moon size={18} className="text-indigo-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sun size={18} className="text-amber-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Appearance</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">{isDark() ? 'Dark' : 'Light'} mode</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(isDark() ? 'light' : 'dark')}
            className={cn(
              'relative w-14 h-8 rounded-full transition-colors duration-300',
              isDark() ? 'bg-indigo-500' : 'bg-neutral-300'
            )}
          >
            <span className={cn(
              'absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300',
              isDark() ? 'translate-x-7' : 'translate-x-1'
            )}>
              {isDark() ? <Moon size={12} className="text-indigo-500" /> : <Sun size={12} className="text-amber-500" />}
            </span>
          </button>
        </div>
      </div>

      {/* Menu Sections */}
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-2 px-1">
            {section.title}
          </p>
          <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3.5
                    hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    item.danger ? 'bg-red-50 dark:bg-red-500/10' : 'bg-neutral-100 dark:bg-white/5'
                  )}>
                    <Icon size={18} className={cn(
                      item.danger ? 'text-red-500' : 'text-neutral-500 dark:text-zinc-400'
                    )} />
                  </div>
                  <span className={cn(
                    'flex-1 text-left text-[15px] font-medium',
                    item.danger ? 'text-red-500' : 'text-neutral-900 dark:text-white'
                  )}>
                    {item.label}
                  </span>
                  {item.rightText && (
                    <span className="text-xs text-neutral-400 dark:text-zinc-600 mr-1">{item.rightText}</span>
                  )}
                  {!item.danger && (
                    <ChevronRight size={16} className="text-neutral-300 dark:text-zinc-700" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}