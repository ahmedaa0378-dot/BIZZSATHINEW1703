import { useState } from 'react';
import {
  ArrowLeft, CreditCard, Smartphone, QrCode, Shield,
  CheckCircle, AlertCircle, ExternalLink, Copy, Check,
} from 'lucide-react';
import { cn, formatINR } from '../lib/utils';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const [copied, setCopied] = useState(false);

  const upiId = (business as any)?.upi_id || '';
  const razorpayConfigured = false; // Will be true when Razorpay keys are added

  const copyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Payments & Collections</h1>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-5 animate-fade-in">

        {/* How it works */}
        <div className="premium-card p-5">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Collect Payments Online</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500">Let customers pay via UPI, Card, Net Banking</p>
              </div>
            </div>

            <div className="space-y-3">
              <Step number={1} text="Share invoice with customer via WhatsApp" />
              <Step number={2} text='Customer taps "Pay Now" on invoice' />
              <Step number={3} text="Payment processed by Razorpay (UPI/Card/Bank)" />
              <Step number={4} text="Invoice auto-marked paid, transaction logged" />
            </div>
          </div>
        </div>

        {/* Razorpay Status */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
              razorpayConfigured ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10')}>
              {razorpayConfigured ? <CheckCircle size={18} className="text-emerald-500" /> :
                <AlertCircle size={18} className="text-amber-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Razorpay</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">
                {razorpayConfigured ? 'Connected & active' : 'Not configured yet'}
              </p>
            </div>
            {!razorpayConfigured && (
              <a href="https://razorpay.com" target="_blank" rel="noopener"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl
                  bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                Setup <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Supported Methods */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">Supported Payment Methods</p>
          <div className="grid grid-cols-3 gap-3">
            <MethodCard icon={Smartphone} label="UPI" desc="GPay, PhonePe, Paytm" />
            <MethodCard icon={CreditCard} label="Cards" desc="Debit & Credit" />
            <MethodCard icon={Shield} label="Net Banking" desc="All major banks" />
          </div>
        </div>

        {/* UPI QR */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">UPI QR Code</p>
          <div className="glass-card p-5 text-center">
            {upiId ? (
              <>
                <div className="w-40 h-40 rounded-2xl bg-white mx-auto mb-4 flex items-center justify-center border border-neutral-200">
                  <QrCode size={80} className="text-neutral-800" />
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">{upiId}</p>
                <button onClick={copyUpi}
                  className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg
                    bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400 text-xs font-semibold">
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy UPI ID'}
                </button>
                <p className="text-[10px] text-neutral-400 dark:text-zinc-600 mt-3">
                  This QR code appears on your invoices when enabled
                </p>
              </>
            ) : (
              <>
                <QrCode size={48} className="text-neutral-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">No UPI ID configured</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-1">
                  Add your UPI ID in Business Profile to generate QR codes
                </p>
                <button onClick={() => navigate('/settings/business')}
                  className="mt-3 px-4 py-2 rounded-xl bg-accent text-black text-xs font-semibold active:scale-95 transition-transform">
                  Add UPI ID
                </button>
              </>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="glass-card p-4 border-l-[3px] border-l-blue-500">
          <p className="text-xs text-neutral-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-white">Note:</strong> BizzSathi does not handle money directly. 
            All payments are processed securely by Razorpay. We only integrate and track payment status.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-blue-500">{number}</span>
      </div>
      <p className="text-xs text-neutral-700 dark:text-zinc-300">{text}</p>
    </div>
  );
}

function MethodCard({ icon: Icon, label, desc }: { icon: typeof CreditCard; label: string; desc: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <Icon size={20} className="text-blue-500 mx-auto mb-2" />
      <p className="text-xs font-semibold text-neutral-900 dark:text-white">{label}</p>
      <p className="text-[10px] text-neutral-500 dark:text-zinc-500 mt-0.5">{desc}</p>
    </div>
  );
}
