import { useState, useEffect } from 'react';
import {
  Search, Plus, FileText, ArrowLeft, ChevronRight,
  Clock, CheckCircle, AlertCircle, Send, XCircle, Inbox,
  MoreVertical, Eye, Trash2,
} from 'lucide-react';
import { cn, formatINR, formatDate } from '../lib/utils';
import { useInvoiceStore, type Invoice } from '../stores/invoiceStore';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';

type Filter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  draft: { label: 'Draft', icon: Clock, color: 'text-neutral-500 dark:text-zinc-400', bg: 'bg-neutral-100 dark:bg-white/8' },
  sent: { label: 'Sent', icon: Send, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  viewed: { label: 'Viewed', icon: Eye, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  partial: { label: 'Partial', icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  overdue: { label: 'Overdue', icon: AlertCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-neutral-400 dark:text-zinc-600', bg: 'bg-neutral-100 dark:bg-white/5' },
};

export default function InvoicesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { invoices, fetchInvoices, updateInvoiceStatus, deleteInvoice } = useInvoiceStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (business?.id) fetchInvoices(business.id);
  }, [business?.id]);

  const filtered = invoices
    .filter((inv) => filter === 'all' || inv.status === filter)
    .filter((inv) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        inv.customer_name.toLowerCase().includes(q) ||
        inv.invoice_number.toLowerCase().includes(q)
      );
    });

  const totalAmount = invoices.reduce((s, i) => s + Number(i.grand_total), 0);
  const paidAmount = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.grand_total), 0);
  const pendingAmount = totalAmount - paidAmount;

  const handleStatusChange = async (id: string, status: string) => {
    await updateInvoiceStatus(id, status);
    setMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this invoice?')) {
      await deleteInvoice(id);
      setMenuOpen(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Invoices</h1>
        <span className="ml-auto text-xs font-semibold text-neutral-400 dark:text-zinc-600">{invoices.length} total</span>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 border-l-[3px] border-l-emerald-500">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Collected</p>
            <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(paidAmount)}</p>
          </div>
          <div className="glass-card p-4 border-l-[3px] border-l-amber-500">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Pending</p>
            <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(pendingAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize',
                filter === f ? 'bg-accent text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="glass-card flex items-center gap-3 px-4 py-3">
          <Search size={18} className="text-neutral-400 flex-shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
        </div>

        {/* Invoice List */}
        {filtered.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <FileText size={24} className="text-neutral-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {search ? 'No invoices found' : 'No invoices yet'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">
              {search ? 'Try a different search' : 'Create your first invoice to get started'}
            </p>
            {!search && (
              <button onClick={() => navigate('/invoices/create')}
                className="mt-1 px-5 py-2 rounded-xl bg-accent text-black text-xs font-semibold active:scale-95 transition-transform">
                + Create Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => {
              const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
              const StatusIcon = sc.icon;
              return (
                <div key={inv.id} className="glass-card p-4 relative">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-blue-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{inv.invoice_number}</p>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', sc.bg, sc.color)}>
                          <StatusIcon size={10} />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-zinc-300">{inv.customer_name}</p>
                      <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-0.5">
                        {formatDate(new Date(inv.invoice_date))}
                        {inv.due_date ? ` · Due ${formatDate(new Date(inv.due_date))}` : ''}
                      </p>
                    </div>

                    {/* Amount + Menu */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(Number(inv.grand_total))}</p>
                      {Number(inv.balance_due) > 0 && inv.status !== 'paid' && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">Due: {formatINR(Number(inv.balance_due))}</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-white/5">
                    {inv.status === 'draft' && (
                      <button onClick={() => handleStatusChange(inv.id, 'sent')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                        <Send size={12} /> Mark Sent
                      </button>
                    )}
                    {(inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial') && (
                      <button onClick={() => handleStatusChange(inv.id, 'paid')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle size={12} /> Mark Paid
                      </button>
                    )}
                    <button onClick={() => handleDelete(inv.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-semibold">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/invoices/create')}
        className="fixed z-40 w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center
          shadow-glow-green active:scale-95 transition-transform"
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 24px)', left: '16px' }}>
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </>
  );
}
