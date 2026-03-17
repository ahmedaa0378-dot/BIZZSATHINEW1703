import { useState, useEffect } from 'react';
import { Search, Plus, CircleUser as UserCircle, Phone, ArrowLeft, Users, Inbox } from 'lucide-react';
import { cn, formatINR } from '../lib/utils';
import { useContactStore, type Contact } from '../stores/contactStore';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import AddContactModal from '../components/contacts/AddContactModal';
import ContactDetailSheet from '../components/contacts/ContactDetailSheet';
import PageWrapper from '../components/layout/PageWrapper';

type Filter = 'all' | 'customer' | 'supplier';

export default function ContactsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { contacts, fetchContacts } = useContactStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (business?.id) fetchContacts(business.id);
  }, [business?.id]);

  const filtered = contacts
    .filter((c) => filter === 'all' || c.type === filter || (filter !== 'all' && c.type === 'both'))
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.business_name?.toLowerCase().includes(q)
      );
    });

  const customerCount = contacts.filter((c) => c.type === 'customer' || c.type === 'both').length;
  const supplierCount = contacts.filter((c) => c.type === 'supplier' || c.type === 'both').length;

  return (
    <PageWrapper>
      {/* Custom header since this is a sub-page */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:backdrop-blur-xl dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Contacts</h1>
        <span className="ml-auto text-xs font-semibold text-neutral-400 dark:text-zinc-600">
          {contacts.length} total
        </span>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="glass-card p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500">All</p>
            <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{contacts.length}</p>
          </div>
          <div className="glass-card p-3 text-center border-emerald-200 dark:border-emerald-500/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Customers</p>
            <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{customerCount}</p>
          </div>
          <div className="glass-card p-3 text-center border-blue-200 dark:border-blue-500/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Suppliers</p>
            <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{supplierCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'customer', 'supplier'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize',
                filter === f
                  ? 'bg-accent text-black'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400'
              )}
            >
              {f === 'all' ? 'All' : f + 's'}
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
            placeholder="Search by name, phone, business..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none"
          />
        </div>

        {/* Contact List */}
        {filtered.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <Users size={24} className="text-neutral-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {search ? 'No contacts found' : 'No contacts yet'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">
              {search ? 'Try a different search term' : 'Add your first customer or supplier'}
            </p>
            {!search && (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-1 px-5 py-2 rounded-xl bg-accent text-black text-xs font-semibold
                  active:scale-95 transition-transform"
              >
                + Add Contact
              </button>
            )}
          </div>
        ) : (
          <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
            {filtered.map((contact) => {
              const balance = Number(contact.outstanding_balance);
              const hasBalance = balance !== 0;
              const isPositive = balance > 0;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                    hover:bg-neutral-50 dark:hover:bg-white/3 transition-colors"
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    contact.type === 'customer' ? 'bg-emerald-50 dark:bg-emerald-500/10' :
                    contact.type === 'supplier' ? 'bg-blue-50 dark:bg-blue-500/10' :
                    'bg-violet-50 dark:bg-violet-500/10'
                  )}>
                    <span className={cn(
                      'text-xs font-bold',
                      contact.type === 'customer' ? 'text-emerald-500' :
                      contact.type === 'supplier' ? 'text-blue-500' : 'text-violet-500'
                    )}>
                      {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{contact.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">
                      {contact.phone ? `+91 ${contact.phone}` : contact.business_name || contact.type}
                    </p>
                  </div>

                  {/* Balance */}
                  {hasBalance && (
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        'text-sm font-bold tabular-nums',
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      )}>
                        {formatINR(Math.abs(balance))}
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-zinc-600">
                        {isPositive ? 'to collect' : 'to pay'}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditContact(null); setShowAdd(true); }}
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

      {/* Add/Edit Modal */}
      <AddContactModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditContact(null);
          if (business?.id) fetchContacts(business.id);
        }}
        editContact={editContact}
      />

      {/* Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        open={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(c) => {
          setSelectedContact(null);
          setEditContact(c);
          setShowAdd(true);
        }}
      />
    </PageWrapper>
  );
}
