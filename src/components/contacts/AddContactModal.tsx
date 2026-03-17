import { useState, useEffect } from 'react';
import {
  X, User, Phone, Mail, Building2, MapPin, CreditCard,
  Loader2, Check, ArrowRight, FileText, Tag, StickyNote,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useContactStore, type Contact } from '../../stores/contactStore';
import { useBusinessStore } from '../../stores/appStore';

interface Props {
  open: boolean;
  onClose: () => void;
  editContact?: Contact | null;
}

type ContactType = 'customer' | 'supplier' | 'both';

export default function AddContactModal({ open, onClose, editContact }: Props) {
  const { addContact, updateContact, loading } = useContactStore();
  const { business } = useBusinessStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<ContactType>('customer');
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [success, setSuccess] = useState(false);

  const isEditing = !!editContact;

  useEffect(() => {
    if (open && editContact) {
      setName(editContact.name);
      setPhone(editContact.phone || '');
      setEmail(editContact.email || '');
      setType(editContact.type);
      setBusinessName(editContact.business_name || '');
      setGstin(editContact.gstin || '');
      setAddress(editContact.address || '');
      setCreditLimit(editContact.credit_limit ? String(editContact.credit_limit) : '');
      setOpeningBalance(editContact.opening_balance ? String(editContact.opening_balance) : '');
      setNotes(editContact.notes || '');
      setShowMore(!!editContact.gstin || !!editContact.address || !!editContact.credit_limit);
      setSuccess(false);
    } else if (open) {
      setName('');
      setPhone('');
      setEmail('');
      setType('customer');
      setBusinessName('');
      setGstin('');
      setAddress('');
      setCreditLimit('');
      setOpeningBalance('');
      setNotes('');
      setShowMore(false);
      setSuccess(false);
    }
  }, [open, editContact]);

  const handleSubmit = async () => {
    if (!name.trim() || !business) return;

    if (isEditing && editContact) {
      const ok = await updateContact(editContact.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        type,
        business_name: businessName.trim() || null,
        gstin: gstin.trim() || null,
        address: address.trim() || null,
        credit_limit: creditLimit ? parseFloat(creditLimit) : 0,
        opening_balance: openingBalance ? parseFloat(openingBalance) : 0,
        notes: notes.trim() || null,
      });
      if (ok) {
        setSuccess(true);
        setTimeout(onClose, 600);
      }
    } else {
      const result = await addContact({
        business_id: business.id,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        type,
        business_name: businessName.trim() || null,
        gstin: gstin.trim() || null,
        address: address.trim() || null,
        credit_limit: creditLimit ? parseFloat(creditLimit) : 0,
        opening_balance: openingBalance ? parseFloat(openingBalance) : 0,
        outstanding_balance: openingBalance ? parseFloat(openingBalance) : 0,
        notes: notes.trim() || null,
        tags: [],
        total_business: 0,
      });
      if (result) {
        setSuccess(true);
        setTimeout(onClose, 600);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3
          bg-white dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Contact Type */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Contact Type *
            </label>
            <div className="flex gap-2">
              {(['customer', 'supplier', 'both'] as ContactType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize',
                    type === t
                      ? 'bg-accent text-black'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <InputField
            icon={User}
            label="Name *"
            value={name}
            onChange={setName}
            placeholder="Rajesh Kumar"
          />

          {/* Phone */}
          <InputField
            icon={Phone}
            label="Phone"
            value={phone}
            onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            type="tel"
          />

          {/* Email */}
          <InputField
            icon={Mail}
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="rajesh@example.com"
            type="email"
          />

          {/* Business Name */}
          <InputField
            icon={Building2}
            label="Business Name"
            value={businessName}
            onChange={setBusinessName}
            placeholder="Rajesh Traders"
          />

          {/* Show More Toggle */}
          {!showMore && (
            <button
              onClick={() => setShowMore(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#9abf2a]"
            >
              More details <ArrowRight size={14} />
            </button>
          )}

          {showMore && (
            <>
              {/* GSTIN */}
              <InputField
                icon={FileText}
                label="GSTIN"
                value={gstin}
                onChange={(v) => setGstin(v.toUpperCase().slice(0, 15))}
                placeholder="29ABCDE1234F1Z5"
              />

              {/* Address */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none
                    bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                    text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                    focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                />
              </div>

              {/* Credit Limit + Opening Balance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                    Credit Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
                    <input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-3 rounded-xl text-sm font-medium
                        bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                        text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                        focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                    Opening Bal.
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
                    <input
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-3 rounded-xl text-sm font-medium
                        bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                        text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                        focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <InputField
                icon={StickyNote}
                label="Notes"
                value={notes}
                onChange={setNotes}
                placeholder="Any notes about this contact"
              />
            </>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || success}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              success
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green'
            )}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : success ? (
              <><Check size={18} /> {isEditing ? 'Updated!' : 'Saved!'}</>
            ) : (
              <>{isEditing ? 'Update Contact' : 'Add Contact'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, value, onChange, placeholder, type = 'text' }: {
  icon: typeof User; label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium
            bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
            text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
            focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
        />
      </div>
    </div>
  );
}
