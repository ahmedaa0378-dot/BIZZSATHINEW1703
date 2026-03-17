import { useState, useEffect } from 'react';
import {
  Search, Plus, ArrowUpCircle, ArrowDownCircle, ShoppingBag,
  Zap, Wallet, CreditCard, Truck, Coffee, Package, Home as HomeIcon,
  Receipt, Banknote, FileText, Wrench, Loader2, Inbox,
} from 'lucide-react';
import { formatINR, cn } from '../lib/utils';
import { useTransactionStore } from '../stores/transactionStore';
import { useBusinessStore } from '../stores/appStore';
import AddTransactionModal from '../components/transactions/AddTransactionModal';
import { useTranslation } from '../lib/i18n';

type Filter = 'all' | 'income' | 'expense';

// Map category names to icons
const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
  'Product Sales': ArrowUpCircle,
  'Service Income': Banknote,
  'Commission': Banknote,
  'Rental Income': HomeIcon,
  'Refund Received': ArrowUpCircle,
  'Other Income': ArrowUpCircle,
  'Stock/Inventory Purchase': ShoppingBag,
  'Rent': HomeIcon,
  'Salary & Wages': Wallet,
  'Electricity & Utilities': Zap,
  'Transport/Delivery': Truck,
  'Phone/Internet/Recharge': CreditCard,
  'Packaging Materials': Package,
  'Marketing & Advertising': FileText,
  'Maintenance & Repairs': Wrench,
  'Food & Tea (Business)': Coffee,
  'Loan EMI/Interest': Banknote,
  'GST/Tax Payment': Receipt,
  'Fuel/Petrol': Truck,
};

function getCategoryIcon(name: string) {
  return CATEGORY_ICONS[name] || Receipt;
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('expense');

  const { t } = useTranslation();
  const { transactions, fetchTransactions, loading } = useTransactionStore();
  const { business } = useBusinessStore();

  useEffect(() => {
    if (business?.id) {
      fetchTransactions(business.id);
    }
  }, [business?.id]);

  const filtered = transactions
    .filter((t) => filter === 'all' || t.type === filter)
    .filter((t) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.category_name.toLowerCase().includes(q) ||
        t.contact_name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <>
      <div className="px-4 pt-3 pb-4 space-y-4 animate-fade-in">
        {/* Summary Pills */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 border-l-[3px] border-l-emerald-500">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{t('total_income')}</p>
            <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(totalIncome)}</p>
          </div>
          <div className="glass-card p-4 border-l-[3px] border-l-red-500">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400 mb-1">{t('total_expenses')}</p>
            <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(totalExpense)}</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                filter === f
                  ? 'bg-accent text-black'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400'
              )}
            >
              {f === 'all' ? t('all') : f === 'income' ? t('income') : t('expense')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="glass-card flex items-center gap-3 px-4 py-3">
          <Search size={18} className="text-neutral-400 dark:text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_transactions')}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none"
          />
        </div>

        {/* Transaction List */}
        {filtered.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <Inbox size={24} className="text-neutral-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">No transactions yet</p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">
              Tap the + button to add your first income or expense
            </p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
            {filtered.map((tx) => {
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

      {/* Floating Add Button */}
      <button
        onClick={() => { setDefaultType('expense'); setShowAdd(true); }}
        className="fixed z-40 w-12 h-12 rounded-full
          bg-accent text-black flex items-center justify-center
          shadow-glow-green active:scale-95 transition-transform"
        style={{
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 24px)',
          left: '16px',
        }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <AddTransactionModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          // Refresh data
          if (business?.id) fetchTransactions(business.id);
        }}
        defaultType={defaultType}
      />
    </>
  );
}
