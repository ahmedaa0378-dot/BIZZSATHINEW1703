import { useState } from 'react';
import {
  ArrowLeft, Globe, Sun, Moon, Monitor, Volume2, VolumeX,
  Download, Loader2, Check, Trash2, AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useThemeStore } from '../stores/themeStore';
import { useLanguageStore, LANGUAGES } from '../stores/languageStore';
import { useAuthStore, useBusinessStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { business } = useBusinessStore();
  const { user, logout } = useAuthStore();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = async () => {
    if (!business?.id) return;
    setExporting(true);

    try {
      // Fetch all transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', business.id)
        .order('transaction_date', { ascending: false });

      if (txData) {
        // Convert to CSV
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Contact', 'Description', 'Status'];
        const rows = txData.map((t: any) => [
          t.transaction_date,
          t.type,
          t.category_name,
          t.amount,
          t.payment_method_name,
          t.contact_name || '',
          t.description || '',
          t.payment_status,
        ]);

        const csv = [headers.join(','), ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bizzsathi-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 5000);
      return;
    }
    // Sign out (actual account deletion would need admin API)
    await supabase.auth.signOut();
    logout();
    navigate('/auth');
  };

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Preferences</h1>
        </div>

        <div className="px-4 pt-4 pb-24 space-y-6 animate-fade-in">

          {/* Language */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">LANGUAGE</p>
            <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLanguage(l.code)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-neutral-400 dark:text-zinc-500" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{l.label}</span>
                  </div>
                  {language === l.code && (
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Check size={12} className="text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">THEME</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'light' as const, label: 'Light', icon: Sun },
                { value: 'dark' as const, label: 'Dark', icon: Moon },
                { value: 'system' as const, label: 'System', icon: Monitor },
              ]).map((t) => {
                const Icon = t.icon;
                const active = theme === t.value;
                return (
                  <button key={t.value} onClick={() => setTheme(t.value)}
                    className={cn(
                      'py-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                      active ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5'
                    )}>
                    <Icon size={22} className={active ? 'text-blue-500' : 'text-neutral-400 dark:text-zinc-600'} />
                    <span className={cn('text-xs font-semibold',
                      active ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-zinc-400')}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">VOICE</p>
            <div className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {voiceEnabled ? <Volume2 size={18} className="text-blue-500" /> : <VolumeX size={18} className="text-neutral-400" />}
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Voice Response</p>
                  <p className="text-xs text-neutral-500 dark:text-zinc-500">App speaks back after actions</p>
                </div>
              </div>
              <button onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={cn('relative w-12 h-7 rounded-full transition-colors duration-300',
                  voiceEnabled ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-white/15')}>
                <span className={cn('absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300',
                  voiceEnabled ? 'translate-x-5.5' : 'translate-x-0.5')} />
              </button>
            </div>
          </div>

          {/* Export */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">DATA</p>
            <button onClick={handleExport} disabled={exporting}
              className="w-full glass-card p-4 flex items-center gap-3 text-left
                hover:border-neutral-300 dark:hover:border-white/15 transition-all active:scale-[0.98]">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                {exporting ? <Loader2 size={16} className="text-blue-500 animate-spin" /> :
                  exported ? <Check size={16} className="text-emerald-500" /> :
                  <Download size={16} className="text-blue-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {exported ? 'Downloaded!' : 'Export All Transactions'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500">Download as CSV file</p>
              </div>
            </button>
          </div>

          {/* Danger Zone */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400 mb-3">DANGER ZONE</p>
            <button onClick={handleDeleteAccount}
              className={cn(
                'w-full glass-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98]',
                showDeleteConfirm ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : ''
              )}>
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                {showDeleteConfirm ? <AlertTriangle size={16} className="text-red-500" /> :
                  <Trash2 size={16} className="text-red-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-red-500">
                  {showDeleteConfirm ? 'Tap again to confirm logout' : 'Delete Account'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500">
                  {showDeleteConfirm ? 'This will sign you out' : 'Export data first, then delete'}
                </p>
              </div>
            </button>
          </div>
        </div>
    </PageWrapper>
  );
}
