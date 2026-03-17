import { useState, useEffect } from 'react';
import {
  ArrowLeft, Loader2, Check, FileText, Hash, Calendar,
  AlignLeft, Percent,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function InvoiceSettingsPage() {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultTerms, setDefaultTerms] = useState('30');
  const [defaultTaxRate, setDefaultTaxRate] = useState('18');
  const [defaultNotes, setDefaultNotes] = useState('Thank you for your business!');
  const [defaultTermsText, setDefaultTermsText] = useState('Payment due within 30 days. Late payments may incur additional charges.');
  const [defaultTemplate, setDefaultTemplate] = useState('classic');
  const [showUpiDefault, setShowUpiDefault] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!business?.id) return;
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business.id)
      .single();

    if (data) {
      // Load from business_hours JSON where we store invoice settings
      const settings = (data.business_hours as any)?.invoice_settings || {};
      if (settings.prefix) setInvoicePrefix(settings.prefix);
      if (settings.default_terms_days) setDefaultTerms(settings.default_terms_days);
      if (settings.default_tax_rate) setDefaultTaxRate(settings.default_tax_rate);
      if (settings.default_notes) setDefaultNotes(settings.default_notes);
      if (settings.default_terms_text) setDefaultTermsText(settings.default_terms_text);
      if (settings.default_template) setDefaultTemplate(settings.default_template);
      if (settings.show_upi_default !== undefined) setShowUpiDefault(settings.show_upi_default);
    }
  };

  const handleSave = async () => {
    if (!business?.id) return;
    setLoading(true);

    // Get current business_hours
    const { data: current } = await supabase
      .from('businesses')
      .select('business_hours')
      .eq('id', business.id)
      .single();

    const currentHours = (current?.business_hours as any) || {};

    const { error } = await supabase
      .from('businesses')
      .update({
        business_hours: {
          ...currentHours,
          invoice_settings: {
            prefix: invoicePrefix.trim().toUpperCase(),
            default_terms_days: defaultTerms,
            default_tax_rate: defaultTaxRate,
            default_notes: defaultNotes.trim(),
            default_terms_text: defaultTermsText.trim(),
            default_template: defaultTemplate,
            show_upi_default: showUpiDefault,
          },
        },
      })
      .eq('id', business.id);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Invoice Settings</h1>
        </div>

        <div className="px-4 pt-4 pb-32 space-y-6 animate-fade-in">

          {/* Numbering */}
          <Section title="NUMBERING">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Invoice Prefix</label>
              <div className="relative">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
                <input type="text" value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                  placeholder="INV"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none" />
              </div>
              <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-1">Preview: {invoicePrefix}-0001</p>
            </div>
          </Section>

          {/* Defaults */}
          <Section title="DEFAULTS">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Payment Terms (days)</label>
                <input type="number" value={defaultTerms} onChange={(e) => setDefaultTerms(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none tabular-nums" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Default GST Rate</label>
                <div className="relative">
                  <input type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)}
                    className="w-full px-4 py-3 pr-8 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white outline-none tabular-nums" />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>
            </div>
          </Section>

          {/* Template */}
          <Section title="TEMPLATE">
            <div className="grid grid-cols-3 gap-3">
              {(['classic', 'modern', 'minimal'] as const).map((t) => (
                <button key={t} onClick={() => setDefaultTemplate(t)}
                  className={cn(
                    'py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2',
                    defaultTemplate === t
                      ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5'
                  )}>
                  <FileText size={24} className={defaultTemplate === t ? 'text-blue-500' : 'text-neutral-400 dark:text-zinc-600'} />
                  <span className={cn('text-xs font-semibold capitalize',
                    defaultTemplate === t ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-zinc-400')}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* UPI QR */}
          <Section title="PAYMENT">
            <div className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Show UPI QR on invoices</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">Auto-add QR code for quick payment</p>
              </div>
              <button onClick={() => setShowUpiDefault(!showUpiDefault)}
                className={cn('relative w-12 h-7 rounded-full transition-colors duration-300',
                  showUpiDefault ? 'bg-accent' : 'bg-neutral-300 dark:bg-white/15')}>
                <span className={cn('absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300',
                  showUpiDefault ? 'translate-x-5.5' : 'translate-x-0.5')} />
              </button>
            </div>
          </Section>

          {/* Default Notes */}
          <Section title="DEFAULT TEXT">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Invoice Notes</label>
              <textarea value={defaultNotes} onChange={(e) => setDefaultNotes(e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Terms & Conditions</label>
              <textarea value={defaultTermsText} onChange={(e) => setDefaultTermsText(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none" />
            </div>
          </Section>
        </div>

        {/* Save */}
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom
          bg-white/90 backdrop-blur-xl border-t border-neutral-200/60
          dark:bg-[#0a0a0a]/90 dark:border-white/5">
          <div className="max-w-[430px] mx-auto px-4 py-3">
            <button onClick={handleSave} disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px]',
                'active:scale-[0.98] transition-all disabled:opacity-50',
                success ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
              {loading ? <Loader2 size={18} className="animate-spin" /> :
                success ? <><Check size={18} /> Saved!</> : 'Save Settings'}
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
