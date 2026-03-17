import { useState, useEffect } from 'react';
import {
  ArrowLeft, Loader2, Check, Camera, Building2, User,
  Phone, Mail, MapPin, FileText, CreditCard, Clock,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useBusinessStore, useAuthStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const BUSINESS_TYPES = ['retail', 'wholesale', 'services', 'manufacturing'];

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const { business, setBusiness } = useBusinessStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [businessCategory, setBusinessCategory] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (data) {
      setBusinessName(data.business_name || '');
      setOwnerName(data.owner_name || '');
      setBusinessType(data.business_type || 'retail');
      setBusinessCategory(data.business_category || '');
      setAddress1(data.address_line1 || '');
      setAddress2(data.address_line2 || '');
      setCity(data.city || '');
      setState(data.state || '');
      setPincode(data.pincode || '');
      setGstin(data.gstin || '');
      setBankAccountName(data.bank_account_name || '');
      setBankAccountNumber(data.bank_account_number || '');
      setBankIfsc(data.bank_ifsc || '');
      setUpiId(data.upi_id || '');
    }
    setInitialLoading(false);
  };

  const handleSave = async () => {
    if (!business?.id) return;
    setLoading(true);

    const { error } = await supabase
      .from('businesses')
      .update({
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        business_type: businessType,
        business_category: businessCategory.trim(),
        address_line1: address1.trim() || null,
        address_line2: address2.trim() || null,
        city: city.trim() || null,
        state: state || null,
        pincode: pincode.trim() || null,
        gstin: gstin.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        bank_account_number: bankAccountNumber.trim() || null,
        bank_ifsc: bankIfsc.trim().toUpperCase() || null,
        upi_id: upiId.trim() || null,
      })
      .eq('id', business.id);

    setLoading(false);

    if (!error) {
      setBusiness({ ...business, name: businessName.trim(), ownerName: ownerName.trim(), type: businessType, category: businessCategory.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center">
        <Loader2 size={24} className="text-blue-500 animate-spin" />
      </div>
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
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Business Profile</h1>
        </div>

        <div className="px-4 pt-4 pb-32 space-y-6 animate-fade-in">

          {/* Basic Info */}
          <Section title="BASIC INFO">
            <Field icon={Building2} label="Business Name *" value={businessName} onChange={setBusinessName} placeholder="Khan General Store" />
            <Field icon={User} label="Owner Name *" value={ownerName} onChange={setOwnerName} placeholder="Ahmed Khan" />

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Business Type</label>
              <div className="flex gap-2 flex-wrap">
                {BUSINESS_TYPES.map((t) => (
                  <button key={t} onClick={() => setBusinessType(t)}
                    className={cn('px-3.5 py-2 rounded-xl text-xs font-semibold transition-all capitalize',
                      businessType === t ? 'bg-accent text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Field icon={FileText} label="Category" value={businessCategory} onChange={setBusinessCategory} placeholder="Kirana/General Store" />
          </Section>

          {/* Address */}
          <Section title="ADDRESS">
            <Field icon={MapPin} label="Address Line 1" value={address1} onChange={setAddress1} placeholder="Shop No. 5, Main Road" />
            <Field icon={MapPin} label="Address Line 2" value={address2} onChange={setAddress2} placeholder="Near Bus Stand" />
            <div className="grid grid-cols-2 gap-3">
              <SmallField label="City" value={city} onChange={setCity} placeholder="Hyderabad" />
              <SmallField label="Pincode" value={pincode} onChange={(v) => setPincode(v.replace(/\D/g, '').slice(0, 6))} placeholder="500059" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">State</label>
              <select value={state} onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none [&>option]:dark:bg-neutral-900">
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </Section>

          {/* GST */}
          <Section title="GST DETAILS">
            <Field icon={FileText} label="GSTIN" value={gstin} onChange={(v) => setGstin(v.toUpperCase().slice(0, 15))} placeholder="29ABCDE1234F1Z5" />
          </Section>

          {/* Bank Details */}
          <Section title="BANK DETAILS (for invoices)">
            <Field icon={CreditCard} label="Account Name" value={bankAccountName} onChange={setBankAccountName} placeholder="Khan General Store" />
            <Field icon={CreditCard} label="Account Number" value={bankAccountNumber} onChange={(v) => setBankAccountNumber(v.replace(/\D/g, ''))} placeholder="1234567890" />
            <Field icon={CreditCard} label="IFSC Code" value={bankIfsc} onChange={(v) => setBankIfsc(v.toUpperCase().slice(0, 11))} placeholder="SBIN0001234" />
            <Field icon={CreditCard} label="UPI ID" value={upiId} onChange={setUpiId} placeholder="business@upi" />
          </Section>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom
          bg-white/90 backdrop-blur-xl border-t border-neutral-200/60
          dark:bg-[#0a0a0a]/90 dark:border-white/5">
          <div className="max-w-[430px] mx-auto px-4 py-3">
            <button onClick={handleSave}
              disabled={loading || !businessName.trim() || !ownerName.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px]',
                'active:scale-[0.98] transition-all disabled:opacity-50',
                success ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
              {loading ? <Loader2 size={18} className="animate-spin" /> :
                success ? <><Check size={18} /> Saved!</> :
                'Save Changes'}
            </button>
          </div>
        </div>
    </PageWrapper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder }: {
  icon: typeof Building2; label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
      </div>
    </div>
  );
}

function SmallField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
    </div>
  );
}
