import { useState, useEffect } from 'react';
import {
  X, ArrowUpCircle, ArrowDownCircle, Calendar, ChevronDown,
  Loader2, Camera, Check, Receipt,
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { useTransactionStore } from '../../stores/transactionStore';
import { useBusinessStore } from '../../stores/appStore';
import type { Category, PaymentMethod } from '../../stores/transactionStore';
import { useTranslation } from '../../lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense';
}

export default function AddTransactionModal({ open, onClose, defaultType = 'expense' }: Props) {
  const { t } = useTranslation();
  const { categories, paymentMethods, addTransaction, loading } = useTransactionStore();
  const { business } = useBusinessStore();

  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState('Cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [contactName, setContactName] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset when type changes
  useEffect(() => {
    setCategoryId('');
    setCategoryName('');
  }, [type]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setAmount('');
      setCategoryId('');
      setCategoryName('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setContactName('');
      setSuccess(false);
      // Set default payment method
      const def = paymentMethods.find((p) => p.is_default);
      if (def) {
        setPaymentMethodId(def.id);
        setPaymentMethodName(def.name);
      }
    }
  }, [open, defaultType]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async () => {
    if (!amount || !categoryName || !business) return;

    const tx = await addTransaction({
      business_id: business.id,
      type,
      amount: parseFloat(amount),
      category_id: categoryId || null,
      category_name: categoryName,
      payment_method_id: paymentMethodId || null,
      payment_method_name: paymentMethodName,
      contact_id: null,
      contact_name: contactName || null,
      description: description || null,
      receipt_url: null,
      payment_status: 'paid',
      tags: [],
      transaction_date: date,
    });

    if (tx) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3
          bg-white dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{t('add_transaction_title')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Type Toggle */}
          <div className="flex gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-white/5">
            <button
              onClick={() => setType('income')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                type === 'income'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-neutral-500 dark:text-zinc-500'
              )}
            >
              <ArrowUpCircle size={16} />
              Income
            </button>
            <button
              onClick={() => setType('expense')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                type === 'expense'
                  ? 'bg-red-500/15 text-red-500 dark:text-red-400 shadow-sm'
                  : 'text-neutral-500 dark:text-zinc-500'
              )}
            >
              <ArrowDownCircle size={16} />
              Expense
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              {t('amount')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-400 dark:text-zinc-500">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-4 rounded-2xl text-2xl font-bold tabular-nums
                  bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                  text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-zinc-700
                  focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44] outline-none transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              {t('category')}
            </label>
            <button
              onClick={() => { setShowCategories(!showCategories); setShowPayment(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white transition-all"
            >
              <span className={categoryName ? '' : 'text-neutral-400 dark:text-zinc-600'}>
                {categoryName || 'Select category'}
              </span>
              <ChevronDown size={16} className={cn('transition-transform', showCategories && 'rotate-180')} />
            </button>

            {showCategories && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl
                bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-lg">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setCategoryName(cat.name);
                      setShowCategories(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors',
                      categoryId === cat.id
                        ? 'text-[#9abf2a] font-semibold bg-[#c8ee44]/10 dark:bg-[#c8ee44]/10'
                        : 'text-neutral-700 dark:text-zinc-300'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Payment Method
            </label>
            <div className="flex gap-2 flex-wrap">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => { setPaymentMethodId(pm.id); setPaymentMethodName(pm.name); }}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                    paymentMethodId === pm.id
                      ? 'bg-accent text-black'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400'
                  )}
                >
                  {pm.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Date
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium
                  bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                  text-neutral-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
          </div>

          {/* Contact Name (optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Contact (Optional)
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Customer or supplier name"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium
                bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>

          {/* Description (optional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 rounded-xl text-sm font-medium
                bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !amount || !categoryName || success}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              success
                ? 'bg-emerald-500 text-white'
                : type === 'income'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_25px_rgba(52,211,153,0.25)]'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_0_25px_rgba(248,113,113,0.25)]'
            )}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : success ? (
              <><Check size={18} /> {t('saved')}</>
            ) : (
              <>
                <Receipt size={18} />
                {type === 'income' ? t('save_income') : t('save_expense')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
