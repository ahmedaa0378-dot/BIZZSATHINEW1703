import { useState, useEffect } from 'react';
import {
  ArrowUpCircle, ArrowDownCircle, FileText, Package,
  TrendingUp, TrendingDown, Sparkles, Zap, DollarSign,
  ShoppingBag, AlertTriangle, ArrowRight, Lightbulb,
  Wallet, CreditCard, Banknote, Truck, Coffee, Receipt,
  Home as HomeIcon, Wrench, Inbox,
} from 'lucide-react';
import { formatINR, getGreeting, formatDate, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '../stores/transactionStore';
import { useBusinessStore } from '../stores/appStore';
import AddTransactionModal from '../components/transactions/AddTransactionModal';
import { useTranslation } from '../lib/i18n';

type Period = 'today' | 'week' | 'month';

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];

  if (period === 'today') {
    return { start: end, end };
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
    return { start: d.toISOString().split('T')[0], end };
  }
  // month
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: d.toISOString().split('T')[0], end };
}

const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
  'Product Sales': ArrowUpCircle,
  'Service Income': Banknote,
  'Stock/Inventory Purchase': ShoppingBag,
  'Rent': HomeIcon,
  'Salary & Wages': Wallet,
  'Electricity & Utilities': Zap,
  'Transport/Delivery': Truck,
  'Food & Tea (Business)': Coffee,
  'Fuel/Petrol': Truck,
  'GST/Tax Payment': Receipt,
  'Maintenance & Repairs': Wrench,
};

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] || Receipt;
}

const INSIGHTS = [
  { icon: Zap, title: 'Transport costs up 35%', desc: 'Compared to last month', color: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15' },
  { icon: DollarSign, title: 'Best selling: Tata Salt', desc: 'Average 40 units/week', color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15' },
  { icon: Lightbulb, title: 'Festival opportunity', desc: 'Holi is in 5 days!', color: 'text-violet-500', bg: 'bg-violet-500/10 dark:bg-violet-500/15' },
];

export default function HomePage() {
  const [period, setPeriod] = useState<Period>('today');
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');

  const { t, greeting } = useTranslation();
  const {
    transactions, dashboardStats, cashInHand,
    fetchTransactions, fetchDashboardStats, fetchCashInHand,
    fetchCategories, fetchPaymentMethods,
  } = useTransactionStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  // Load data
  useEffect(() => {
    if (business?.id) {
      fetchTransactions(business.id);
      fetchCategories(business.id);
      fetchPaymentMethods(business.id);
      fetchCashInHand(business.id);
    }
  }, [business?.id]);

  // Fetch stats when period changes
  useEffect(() => {
    if (business?.id) {
      const { start, end } = getDateRange(period);
      fetchDashboardStats(business.id, start, end);
    }
  }, [business?.id, period]);

  const stats = dashboardStats || { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 };
  const recentTx = transactions.slice(0, 7);

  const refreshAll = () => {
    if (business?.id) {
      fetchTransactions(business.id);
      const { start, end } = getDateRange(period);
      fetchDashboardStats(business.id, start, end);
      fetchCashInHand(business.id);
    }
  };

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <>
      <div className="px-4 pt-3 pb-4 space-y-4 animate-fade-in">
        {/* === HERO CARD === */}
        <div className="hero-card p-5">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">
                  {greeting()}, {business?.ownerName?.split(' ')[0] || 'there'}! 👋
                </h1>
                <p className="text-sm text-white/60 mt-0.5">{formatDate(new Date())}</p>
              </div>
            </div>

            {/* Period Toggle */}
            <div className="flex gap-2 mb-5">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                    period === p
                      ? 'bg-accent text-black shadow-glow-green'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  )}
                >
                  {p === 'today' ? t('today') : p === 'week' ? t('this_week') : t('this_month')}
                </button>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex items-start justify-between">
              <StatColumn label={t('income')} amount={Number(stats.total_income)} color="text-emerald-400" />
              <div className="w-px h-14 bg-white/10 mx-2 mt-1" />
              <StatColumn label={t('expense')} amount={Number(stats.total_expense)} color="text-red-400" />
              <div className="w-px h-14 bg-white/10 mx-2 mt-1" />
              <StatColumn label={t('profit')} amount={Number(stats.profit)} color="text-accent" />
            </div>
          </div>
        </div>

        {/* === CASH IN HAND === */}
        <div className="premium-card p-5">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-1">{t('cash_in_hand')}</p>
              <p className="text-[28px] font-bold tracking-tight tabular-nums text-neutral-900 dark:text-white">
                {formatINR(cashInHand)}
              </p>
              <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-1">{t('updated_just_now')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* === QUICK ACTIONS === */}
        <div className="grid grid-cols-4 gap-2.5">
          <QuickAction icon={ArrowUpCircle} label={t('add_income')} color="emerald"
            onClick={() => { setAddType('income'); setShowAdd(true); }} />
          <QuickAction icon={ArrowDownCircle} label={t('add_expense')} color="red"
            onClick={() => { setAddType('expense'); setShowAdd(true); }} />
          <QuickAction icon={FileText} label={t('create_invoice')} color="blue" onClick={() => navigate('/invoices/create')} />
          <QuickAction icon={Package} label={t('check_stock')} color="amber" onClick={() => {}} />
        </div>

        {/* === OUTSTANDING === */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 border-l-[3px] border-l-emerald-500">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{t('to_collect')}</p>
            <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(0)}</p>
          </div>
          <div className="glass-card p-4 border-l-[3px] border-l-red-500">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400 mb-1">{t('to_pay')}</p>
            <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(0)}</p>
          </div>
        </div>

        {/* === AI INSIGHTS (still static for now) === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{t('ai_insights')}</h2>
            </div>
            <button className="text-xs font-semibold text-[#9abf2a]">{t('view_all')}</button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-4 px-4">
            {INSIGHTS.map((item, i) => (
              <div key={i} className="accent-card p-4 min-w-[240px] snap-start flex-shrink-0">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', item.bg)}>
                  <item.icon size={18} className={item.color} />
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-0.5">{item.title}</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* === RECENT TRANSACTIONS === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{t('recent_transactions')}</h2>
            <button className="text-xs font-semibold text-[#9abf2a]">{t('view_all')}</button>
          </div>

          {recentTx.length === 0 ? (
            <div className="glass-card p-8 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                <Inbox size={24} className="text-neutral-400 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t('no_transactions_yet')}</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">
                {t('add_first_transaction')}
              </p>
              <button
                onClick={() => { setAddType('expense'); setShowAdd(true); }}
                className="mt-1 px-5 py-2 rounded-xl bg-accent text-black text-xs font-semibold
                  active:scale-95 transition-transform"
              >
                + Add Transaction
              </button>
            </div>
          ) : (
            <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
              {recentTx.map((tx) => {
                const isIncome = tx.type === 'income';
                const Icon = getCategoryIcon(tx.category_name);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'
                    )}>
                      <Icon size={18} className={isIncome ? 'text-emerald-500' : 'text-red-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {tx.contact_name || tx.category_name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">
                        {formatTxDate(tx.transaction_date)}
                        {tx.description ? ` · ${tx.description}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        'text-sm font-bold tabular-nums',
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      )}>
                        {isIncome ? '+' : '-'}{formatINR(Number(tx.amount))}
                      </p>
                      <p className="text-[10px] font-medium text-neutral-400 dark:text-zinc-600 mt-0.5">
                        {tx.payment_method_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* === LOW STOCK ALERT === */}
        <div className="glass-card p-4 border-l-[3px] border-l-amber-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Stock alerts coming soon</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">Add products to get stock alerts</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-neutral-400" />
        </div>
      </div>

      <AddTransactionModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          refreshAll();
        }}
        defaultType={addType}
      />
    </>
  );
}

/* ---- Sub-components ---- */

function StatColumn({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex-1 text-center">
      <p className={cn('text-[10px] font-semibold uppercase tracking-widest mb-1', color)}>{label}</p>
      <p className="text-[18px] font-bold text-white tabular-nums">{formatINR(amount)}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: {
  icon: typeof ArrowUpCircle; label: string; color: string; onClick: () => void;
}) {
  const colorMap: Record<string, { bg: string; darkBg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    red: { bg: 'bg-red-50', darkBg: 'dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
    blue: { bg: 'bg-[#c8ee44]/10', darkBg: 'dark:bg-[#c8ee44]/10', text: 'text-[#9abf2a] dark:text-[#c8ee44]' },
    amber: { bg: 'bg-amber-50', darkBg: 'dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  };
  const c = colorMap[color];

  return (
    <button onClick={onClick} className="glass-card p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg, c.darkBg)}>
        <Icon size={20} className={c.text} />
      </div>
      <span className="text-[11px] font-semibold text-neutral-700 dark:text-zinc-300">{label}</span>
    </button>
  );
}
