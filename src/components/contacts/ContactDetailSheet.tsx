import { useState, useEffect } from 'react';
import {
  X, Phone, Mail, MessageCircle, MapPin, Building2,
  FileText, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle,
  Receipt, ChevronRight, Inbox, AlertTriangle,
} from 'lucide-react';
import { cn, formatINR } from '../../lib/utils';
import { type Contact, useContactStore } from '../../stores/contactStore';
import { useTransactionStore, type Transaction } from '../../stores/transactionStore';

interface Props {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
}

export default function ContactDetailSheet({ contact, open, onClose, onEdit }: Props) {
  const { deleteContact } = useContactStore();
  const { transactions } = useTransactionStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open || !contact) return null;

  const contactTx = transactions.filter(
    (t) => t.contact_name?.toLowerCase() === contact.name.toLowerCase() || t.contact_id === contact.id
  );

  const totalIncome = contactTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = contactTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = Number(contact.outstanding_balance);
  const isPositive = balance >= 0;

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteContact(contact.id);
      onClose();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3
          bg-white dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Contact Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Profile Card */}
          <div className="premium-card p-5">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
                  contact.type === 'customer' ? 'bg-emerald-500/15' :
                  contact.type === 'supplier' ? 'bg-blue-500/15' : 'bg-violet-500/15'
                )}>
                  <span className={cn(
                    'text-lg font-bold',
                    contact.type === 'customer' ? 'text-emerald-500' :
                    contact.type === 'supplier' ? 'text-blue-500' : 'text-violet-500'
                  )}>
                    {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-neutral-900 dark:text-white truncate">{contact.name}</p>
                  {contact.business_name && (
                    <p className="text-sm text-neutral-500 dark:text-zinc-400">{contact.business_name}</p>
                  )}
                  <span className={cn(
                    'inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase',
                    contact.type === 'customer' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    contact.type === 'supplier' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                  )}>
                    {contact.type}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                      bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <Phone size={14} /> Call
                  </a>
                )}
                {contact.phone && (
                  <a href={`https://wa.me/91${contact.phone}`} target="_blank" rel="noopener"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                      bg-accent/10 text-accent-dark dark:text-accent text-xs font-semibold">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                      bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className={cn(
            'glass-card p-4 border-l-[3px]',
            isPositive ? 'border-l-emerald-500' : 'border-l-red-500'
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-1">
              {isPositive ? 'They owe you' : 'You owe them'}
            </p>
            <p className={cn(
              'text-2xl font-bold tabular-nums',
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            )}>
              {formatINR(Math.abs(balance))}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Income</p>
              <p className="text-base font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(totalIncome)}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400 mb-1">Expense</p>
              <p className="text-base font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(totalExpense)}</p>
            </div>
          </div>

          {/* Contact Info */}
          {(contact.phone || contact.email || contact.address || contact.gstin) && (
            <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
              {contact.phone && (
                <InfoRow icon={Phone} label="Phone" value={`+91 ${contact.phone}`} />
              )}
              {contact.email && (
                <InfoRow icon={Mail} label="Email" value={contact.email} />
              )}
              {contact.address && (
                <InfoRow icon={MapPin} label="Address" value={contact.address} />
              )}
              {contact.gstin && (
                <InfoRow icon={FileText} label="GSTIN" value={contact.gstin} />
              )}
            </div>
          )}

          {/* Transaction History */}
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Transaction History</p>
            {contactTx.length === 0 ? (
              <div className="glass-card p-6 flex flex-col items-center gap-2">
                <Inbox size={20} className="text-neutral-400 dark:text-zinc-600" />
                <p className="text-xs text-neutral-500 dark:text-zinc-500">No transactions with this contact</p>
              </div>
            ) : (
              <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
                {contactTx.slice(0, 10).map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'
                      )}>
                        {isIncome ? <ArrowUpCircle size={14} className="text-emerald-500" /> : <ArrowDownCircle size={14} className="text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{tx.category_name}</p>
                        <p className="text-[11px] text-neutral-500 dark:text-zinc-500">{formatTxDate(tx.transaction_date)}</p>
                      </div>
                      <p className={cn(
                        'text-sm font-bold tabular-nums',
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      )}>
                        {isIncome ? '+' : '-'}{formatINR(Number(tx.amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit / Delete */}
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(contact)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl
                bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white font-semibold text-sm
                active:scale-[0.98] transition-all"
            >
              <Edit2 size={16} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                'px-6 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm',
                'active:scale-[0.98] transition-all',
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-500'
              )}
            >
              <Trash2 size={16} />
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={16} className="text-neutral-400 dark:text-zinc-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">{label}</p>
        <p className="text-sm text-neutral-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}
