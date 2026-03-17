import { useState } from 'react';
import {
  ArrowLeft, MessageCircle, Bell, Send, Clock, Package,
  FileText, AlertCircle, CheckCircle, Settings, ExternalLink,
  Smartphone, ChevronRight, Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

const NOTIFICATION_TYPES = [
  { id: 'daily_summary', label: 'Daily Business Summary', desc: 'Income, expense, profit at end of day', icon: Clock, default: true },
  { id: 'payment_received', label: 'Payment Received', desc: 'When a customer pays an invoice', icon: CheckCircle, default: true },
  { id: 'invoice_shared', label: 'Invoice Shared', desc: 'Confirmation when invoice is sent', icon: FileText, default: true },
  { id: 'payment_reminder', label: 'Payment Reminders', desc: 'Auto-remind customers of due payments', icon: Send, default: true },
  { id: 'low_stock', label: 'Low Stock Alerts', desc: 'When product falls below threshold', icon: Package, default: true },
  { id: 'overdue_alert', label: 'Overdue Invoice Alerts', desc: 'When invoices pass due date', icon: AlertCircle, default: false },
  { id: 'weekly_summary', label: 'Weekly Summary', desc: 'Detailed weekly business report', icon: Bell, default: false },
  { id: 'ai_insights', label: 'AI Insights', desc: 'Proactive business recommendations', icon: Zap, default: false },
];

const COMMANDS = [
  { command: '₹3000 maal liya Sharma se', desc: 'Log expense — amount, contact auto-detected' },
  { command: 'Aaj ka report', desc: 'Get today\'s income/expense summary' },
  { command: 'Ramesh ka balance', desc: 'Check outstanding for a contact' },
  { command: 'Stock check chawal', desc: 'Check inventory for a product' },
  { command: 'Invoice banao Suresh ke liye', desc: 'Create a draft invoice' },
  { command: 'Payment reminder Ramesh ko', desc: 'Send payment reminder to contact' },
];

export default function WhatsAppPage() {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TYPES.map((n) => [n.id, n.default]))
  );
  const [summaryTime, setSummaryTime] = useState('21:00');
  const [view, setView] = useState<'main' | 'commands'>('main');

  const isConnected = false; // Will be true when Whapi/Meta API is configured

  const toggleNotification = (id: string) => {
    setNotifications({ ...notifications, [id]: !notifications[id] });
  };

  if (view === 'commands') {
    return (
      <PageWrapper>
        <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
          bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
          dark:bg-black/80 dark:border-white/5">
          <button onClick={() => setView('main')} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">WhatsApp Commands</h1>
        </div>
        <div className="px-4 pt-3 pb-24 space-y-3 animate-fade-in">
          <p className="text-sm text-neutral-500 dark:text-zinc-400">
            Send these commands to your BizzSathi WhatsApp number to manage your business on the go.
          </p>
          {COMMANDS.map((cmd, i) => (
            <div key={i} className="glass-card p-4">
              <p className="text-sm font-mono font-semibold text-neutral-900 dark:text-white mb-1">"{cmd.command}"</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">{cmd.desc}</p>
            </div>
          ))}
          <div className="glass-card p-4 border-l-[3px] border-l-blue-500">
            <p className="text-xs text-neutral-600 dark:text-zinc-400">
              <strong className="text-neutral-900 dark:text-white">Tip:</strong> You can type in Hindi, English, or Hinglish. The AI will understand all three.
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">WhatsApp Integration</h1>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-5 animate-fade-in">

        {/* Connection Status */}
        <div className="premium-card p-5">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center',
                isConnected ? 'bg-emerald-500/15' : 'bg-amber-500/10')}>
                <MessageCircle size={24} className={isConnected ? 'text-emerald-500' : 'text-amber-500'} />
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">WhatsApp</p>
                <p className={cn('text-xs font-semibold', isConnected ? 'text-emerald-500' : 'text-amber-500')}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>

            {!isConnected && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600 dark:text-zinc-400">
                  Connect WhatsApp to receive business notifications and manage your business via chat commands.
                </p>
                <div className="space-y-2">
                  <Step number={1} text="Create Whapi.Cloud account (free sandbox)" />
                  <Step number={2} text="Get your API token and channel URL" />
                  <Step number={3} text="Add token to BizzSathi settings" />
                  <Step number={4} text="Start receiving notifications!" />
                </div>
                <a href="https://whapi.cloud" target="_blank" rel="noopener"
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl
                    bg-emerald-500 text-white font-semibold text-sm
                    active:scale-[0.98] transition-all">
                  <ExternalLink size={16} /> Setup Whapi.Cloud
                </a>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">How It Works</p>
          <div className="grid grid-cols-2 gap-3">
            <MiniCard icon={Bell} label="Notifications" desc="Daily summaries, alerts, reminders" />
            <MiniCard icon={Send} label="Commands" desc="Text to log expenses, check reports" />
            <MiniCard icon={FileText} label="Invoices" desc="Share & track via WhatsApp" />
            <MiniCard icon={Smartphone} label="Deep Links" desc="Tap to open app, no login" />
          </div>
        </div>

        {/* Commands Reference */}
        <button onClick={() => setView('commands')}
          className="w-full glass-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <MessageCircle size={18} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">WhatsApp Commands</p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500">{COMMANDS.length} commands available</p>
          </div>
          <ChevronRight size={16} className="text-neutral-300 dark:text-zinc-700" />
        </button>

        {/* Notification Settings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">Notification Settings</p>
          </div>

          <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
            {NOTIFICATION_TYPES.map((notif) => {
              const Icon = notif.icon;
              const enabled = notifications[notif.id];
              return (
                <div key={notif.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
                    enabled ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-neutral-100 dark:bg-white/5')}>
                    <Icon size={16} className={enabled ? 'text-emerald-500' : 'text-neutral-400 dark:text-zinc-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{notif.label}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-500">{notif.desc}</p>
                  </div>
                  <button onClick={() => toggleNotification(notif.id)}
                    className={cn('relative w-11 h-6 rounded-full transition-colors duration-300',
                      enabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-white/15')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300',
                      enabled ? 'translate-x-5.5' : 'translate-x-0.5')} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Time */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Clock size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Daily Summary Time</p>
              <p className="text-[10px] text-neutral-500 dark:text-zinc-500">When to send the daily report</p>
            </div>
          </div>
          <input type="time" value={summaryTime} onChange={(e) => setSummaryTime(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm font-medium bg-neutral-50 dark:bg-white/5 
              border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none" />
        </div>
      </div>
    </PageWrapper>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-blue-500">{number}</span>
      </div>
      <p className="text-xs text-neutral-700 dark:text-zinc-300">{text}</p>
    </div>
  );
}

function MiniCard({ icon: Icon, label, desc }: { icon: typeof Bell; label: string; desc: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <Icon size={18} className="text-blue-500 mx-auto mb-1.5" />
      <p className="text-xs font-semibold text-neutral-900 dark:text-white">{label}</p>
      <p className="text-[9px] text-neutral-500 dark:text-zinc-500 mt-0.5">{desc}</p>
    </div>
  );
}
