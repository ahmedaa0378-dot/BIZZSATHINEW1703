import { useState, useEffect } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown, BarChart3,
  PieChart, Calendar, FileText, Users, ChevronRight,
  ArrowUpCircle, ArrowDownCircle, Clock, Receipt, Inbox,
} from 'lucide-react';
import { cn, formatINR, formatDate } from '../lib/utils';
import { useReportsStore, getDateRange } from '../stores/reportsStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

type ReportView = 'overview' | 'pnl' | 'categories' | 'trend' | 'receivables' | 'daybook';
type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function ReportsPage() {
  const [view, setView] = useState<ReportView>('overview');
  const [period, setPeriod] = useState<Period>('month');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');

  const {
    stats, prevStats, expenseBreakdown, incomeBreakdown,
    dailyTrend, receivablesAging, loading,
    fetchPnL, fetchPrevPnL, fetchCategoryBreakdown, fetchDailyTrend, fetchReceivablesAging,
  } = useReportsStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (business?.id) {
      loadData();
    }
  }, [business?.id, period]);

  useEffect(() => {
    if (business?.id && (view === 'categories')) {
      const { start, end } = getDateRange(period);
      fetchCategoryBreakdown(business.id, catType, start, end);
    }
  }, [catType, view]);

  const loadData = () => {
    if (!business?.id) return;
    const { start, end, prevStart, prevEnd } = getDateRange(period);
    fetchPnL(business.id, start, end);
    fetchPrevPnL(business.id, prevStart, prevEnd);
    fetchCategoryBreakdown(business.id, 'expense', start, end);
    fetchCategoryBreakdown(business.id, 'income', start, end);
    fetchDailyTrend(business.id, start, end);
    fetchReceivablesAging(business.id);
    fetchTransactions(business.id);
  };

  const s = stats || { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 };
  const ps = prevStats || { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 };

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev * 100);
  };

  const incomeChange = pctChange(Number(s.total_income), Number(ps.total_income));
  const expenseChange = pctChange(Number(s.total_expense), Number(ps.total_expense));
  const profitChange = pctChange(Number(s.profit), Number(ps.profit));
  const margin = Number(s.total_income) > 0 ? (Number(s.profit) / Number(s.total_income) * 100) : 0;

  if (view !== 'overview') {
    return (
      <DetailView
        view={view}
        period={period}
        setPeriod={setPeriod}
        catType={catType}
        setCatType={setCatType}
        onBack={() => setView('overview')}
        stats={s}
        prevStats={ps}
        expenseBreakdown={expenseBreakdown}
        incomeBreakdown={incomeBreakdown}
        dailyTrend={dailyTrend}
        receivablesAging={receivablesAging}
        transactions={transactions}
        incomeChange={incomeChange}
        expenseChange={expenseChange}
        profitChange={profitChange}
        margin={margin}
      />
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Reports</h1>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {(['today', 'week', 'month', 'quarter', 'year'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize',
                period === p ? 'bg-accent text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'quarter' ? 'Quarter' : 'Year'}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="hero-card p-5">
          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-3">
              <QuickStat label="Income" value={Number(s.total_income)} change={incomeChange} color="text-emerald-400" />
              <QuickStat label="Expense" value={Number(s.total_expense)} change={expenseChange} color="text-red-400" />
              <QuickStat label="Profit" value={Number(s.profit)} change={profitChange} color="text-accent" />
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <span className="text-xs text-white/50">{Number(s.transaction_count)} transactions</span>
              <span className="text-xs text-white/50">Margin: {margin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="space-y-3">
          <ReportCard icon={BarChart3} title="Profit & Loss" desc="Income, expenses, net profit" color="blue" onClick={() => setView('pnl')} />
          <ReportCard icon={PieChart} title="Category Analysis" desc="Where your money goes" color="violet" onClick={() => setView('categories')} />
          <ReportCard icon={TrendingUp} title="Income vs Expense Trend" desc="Daily trend chart" color="emerald" onClick={() => setView('trend')} />
          <ReportCard icon={Users} title="Receivables Aging" desc="Outstanding invoice analysis" color="amber" onClick={() => setView('receivables')} />
          <ReportCard icon={Receipt} title="Day Book / Ledger" desc="All transactions chronologically" color="red" onClick={() => setView('daybook')} />
        </div>
      </div>
    </PageWrapper>
  );
}

// ============ DETAIL VIEW ============

function DetailView({ view, period, setPeriod, catType, setCatType, onBack, stats, prevStats,
  expenseBreakdown, incomeBreakdown, dailyTrend, receivablesAging, transactions,
  incomeChange, expenseChange, profitChange, margin }: any) {

  const titles: Record<string, string> = {
    pnl: 'Profit & Loss',
    categories: 'Category Analysis',
    trend: 'Income vs Expense',
    receivables: 'Receivables Aging',
    daybook: 'Day Book',
  };

  const { start, end } = getDateRange(period);

  // Filter transactions for daybook
  const dayBookTx = transactions
    .filter((t: any) => t.transaction_date >= start && t.transaction_date <= end)
    .sort((a: any, b: any) => b.transaction_date.localeCompare(a.transaction_date));

  const breakdown = catType === 'expense' ? expenseBreakdown : incomeBreakdown;
  const breakdownTotal = breakdown.reduce((s: number, b: any) => s + Number(b.total), 0);

  // Trend chart max
  const trendMax = Math.max(...dailyTrend.map((d: any) => Math.max(Number(d.income), Number(d.expense))), 1);

  // Aging buckets
  const agingBuckets = ['0-30 days', '31-60 days', '61-90 days', '90+ days'];
  const agingByBucket = agingBuckets.map((bucket) => {
    const items = receivablesAging.filter((a: any) => a.aging_bucket === bucket);
    const total = items.reduce((s: number, a: any) => s + Number(a.balance_due), 0);
    return { bucket, items, total };
  });

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">{titles[view]}</h1>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Period */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {(['today', 'week', 'month', 'quarter', 'year'] as string[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize',
                period === p ? 'bg-accent text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'quarter' ? 'Quarter' : 'Year'}
            </button>
          ))}
        </div>

        {/* ===== P&L ===== */}
        {view === 'pnl' && (
          <div className="space-y-4">
            <StatCard label="Total Income" value={Number(stats.total_income)} change={incomeChange} positive icon={ArrowUpCircle} />
            <StatCard label="Total Expense" value={Number(stats.total_expense)} change={expenseChange} positive={expenseChange < 0} icon={ArrowDownCircle} />
            <div className="premium-card p-5">
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-1">Net Profit</p>
                <p className={cn('text-3xl font-bold tabular-nums', Number(stats.profit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                  {formatINR(Number(stats.profit))}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <ChangeBadge value={profitChange} />
                  <span className="text-xs text-neutral-500 dark:text-zinc-500">Margin: {margin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Mini breakdown */}
            <div className="glass-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">Top Expenses</p>
              {expenseBreakdown.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-neutral-700 dark:text-zinc-300">{item.category_name}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(Number(item.total))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CATEGORIES ===== */}
        {view === 'categories' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setCatType('expense')}
                className={cn('flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  catType === 'expense' ? 'bg-red-500/15 text-red-500' : 'bg-neutral-100 dark:bg-white/8 text-neutral-500 dark:text-zinc-400')}>
                Expenses
              </button>
              <button onClick={() => setCatType('income')}
                className={cn('flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  catType === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-white/8 text-neutral-500 dark:text-zinc-400')}>
                Income
              </button>
            </div>

            <div className="premium-card p-4">
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-1">
                  Total {catType === 'expense' ? 'Expenses' : 'Income'}
                </p>
                <p className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(breakdownTotal)}</p>
              </div>
            </div>

            {/* Bar chart */}
            {breakdown.length > 0 && (
              <div className="glass-card p-4 space-y-3">
                {breakdown.map((item: any, i: number) => {
                  const pct = breakdownTotal > 0 ? (Number(item.total) / breakdownTotal * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700 dark:text-zinc-300 truncate flex-1">{item.category_name}</span>
                        <span className="text-xs font-bold tabular-nums text-neutral-900 dark:text-white ml-2">{formatINR(Number(item.total))}</span>
                      </div>
                      <div className="h-3 rounded-full bg-neutral-100 dark:bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-600">{item.count} transactions</span>
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-600">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {breakdown.length === 0 && <EmptyState text="No data for this period" />}
          </div>
        )}

        {/* ===== TREND ===== */}
        {view === 'trend' && (
          <div className="space-y-4">
            {dailyTrend.length > 0 ? (
              <div className="glass-card p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-neutral-500 dark:text-zinc-400">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-xs text-neutral-500 dark:text-zinc-400">Expense</span>
                  </div>
                </div>

                {/* Simple bar chart */}
                <div className="flex items-end gap-1 h-40">
                  {dailyTrend.map((d: any, i: number) => {
                    const incH = trendMax > 0 ? (Number(d.income) / trendMax * 100) : 0;
                    const expH = trendMax > 0 ? (Number(d.expense) / trendMax * 100) : 0;
                    const dayLabel = new Date(d.day).getDate();
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                        <div className="flex gap-[1px] items-end w-full justify-center" style={{ height: '130px' }}>
                          <div className="flex-1 max-w-[8px] rounded-t-sm bg-emerald-500 transition-all duration-500"
                            style={{ height: `${Math.max(incH, 2)}%` }} />
                          <div className="flex-1 max-w-[8px] rounded-t-sm bg-red-500 transition-all duration-500"
                            style={{ height: `${Math.max(expH, 2)}%` }} />
                        </div>
                        <span className="text-[8px] text-neutral-400 dark:text-zinc-600">{dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState text="No trend data for this period" />
            )}

            {/* Daily summary list */}
            {dailyTrend.length > 0 && (
              <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
                {dailyTrend.filter((d: any) => Number(d.income) > 0 || Number(d.expense) > 0).reverse().map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-700 dark:text-zinc-300">
                      {formatDate(new Date(d.day))}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{formatINR(Number(d.income))}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-red-500">
                        -{formatINR(Number(d.expense))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== RECEIVABLES ===== */}
        {view === 'receivables' && (
          <div className="space-y-4">
            {/* Aging buckets */}
            <div className="grid grid-cols-2 gap-3">
              {agingBuckets.map((bucket, i) => {
                const items = receivablesAging.filter((a: any) => a.aging_bucket === bucket);
                const total = items.reduce((s: number, a: any) => s + Number(a.balance_due), 0);
                const colors = ['emerald', 'amber', 'orange', 'red'];
                return (
                  <div key={bucket} className="glass-card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">{bucket}</p>
                    <p className={cn('text-lg font-bold tabular-nums mt-0.5',
                      i < 1 ? 'text-emerald-600 dark:text-emerald-400' :
                      i < 2 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-500 dark:text-red-400')}>
                      {formatINR(total)}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-zinc-600">{items.length} invoices</p>
                  </div>
                );
              })}
            </div>

            {/* Detail list */}
            {receivablesAging.length > 0 ? (
              <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
                {receivablesAging.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{item.customer_name}</p>
                      <p className="text-xs text-neutral-500 dark:text-zinc-500">{item.invoice_number} · {item.days_overdue} days</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold tabular-nums text-red-500">{formatINR(Number(item.balance_due))}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-zinc-600">{item.aging_bucket}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No outstanding receivables" />
            )}
          </div>
        )}

        {/* ===== DAY BOOK ===== */}
        {view === 'daybook' && (
          <div className="space-y-4">
            {/* Running totals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 border-l-[3px] border-l-emerald-500">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Income</p>
                <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(Number(stats.total_income))}</p>
              </div>
              <div className="glass-card p-3 border-l-[3px] border-l-red-500">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500">Expense</p>
                <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(Number(stats.total_expense))}</p>
              </div>
            </div>

            {dayBookTx.length > 0 ? (
              <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
                {dayBookTx.map((tx: any) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10')}>
                        {isIncome ? <ArrowUpCircle size={14} className="text-emerald-500" /> :
                          <ArrowDownCircle size={14} className="text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {tx.contact_name || tx.category_name}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-zinc-500">
                          {formatDate(new Date(tx.transaction_date))} · {tx.payment_method_name}
                        </p>
                      </div>
                      <p className={cn('text-sm font-bold tabular-nums',
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                        {isIncome ? '+' : '-'}{formatINR(Number(tx.amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="No transactions for this period" />
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// ============ SUB-COMPONENTS ============

function QuickStat({ label, value, change, color }: { label: string; value: number; change: number; color: string }) {
  return (
    <div className="text-center">
      <p className={cn('text-[10px] font-semibold uppercase tracking-widest mb-1', color)}>{label}</p>
      <p className="text-[16px] font-bold text-white tabular-nums">{formatINR(value)}</p>
      <ChangeBadge value={change} small />
    </div>
  );
}

function ChangeBadge({ value, small }: { value: number; small?: boolean }) {
  const positive = value >= 0;
  return (
    <div className={cn('inline-flex items-center gap-0.5',
      small ? 'mt-0.5' : '')}>
      {positive ? <TrendingUp size={small ? 8 : 10} className="text-emerald-400" /> :
        <TrendingDown size={small ? 8 : 10} className="text-red-400" />}
      <span className={cn(
        'font-semibold tabular-nums',
        small ? 'text-[9px]' : 'text-xs',
        positive ? 'text-emerald-400' : 'text-red-400'
      )}>
        {positive ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );
}

function StatCard({ label, value, change, positive, icon: Icon }: {
  label: string; value: number; change: number; positive: boolean; icon: typeof ArrowUpCircle;
}) {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-1">{label}</p>
        <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(value)}</p>
        <ChangeBadge value={change} />
      </div>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
        positive ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
        <Icon size={20} className={positive ? 'text-emerald-500' : 'text-red-500'} />
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, title, desc, color, onClick }: {
  icon: typeof BarChart3; title: string; desc: string; color: string; onClick: () => void;
}) {
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-500/10',
    violet: 'bg-violet-50 dark:bg-violet-500/10',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
    amber: 'bg-amber-50 dark:bg-amber-500/10',
    red: 'bg-red-50 dark:bg-red-500/10',
  };
  const textMap: Record<string, string> = {
    blue: 'text-blue-500',
    violet: 'text-violet-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
  };

  return (
    <button onClick={onClick}
      className="w-full glass-card p-4 flex items-center gap-4 text-left
        hover:border-neutral-300 dark:hover:border-white/15 transition-all active:scale-[0.98]">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', bgMap[color])}>
        <Icon size={20} className={textMap[color]} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
        <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-neutral-300 dark:text-zinc-700 flex-shrink-0" />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-card p-8 flex flex-col items-center gap-2">
      <Inbox size={20} className="text-neutral-400 dark:text-zinc-600" />
      <p className="text-xs text-neutral-500 dark:text-zinc-500">{text}</p>
    </div>
  );
}
