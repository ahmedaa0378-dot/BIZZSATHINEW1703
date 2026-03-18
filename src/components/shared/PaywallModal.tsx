import { X, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  limitType: string;
  current: number;
  max: number;
}

const LIMIT_LABELS: Record<string, string> = {
  transaction: 'transactions this month',
  invoice: 'invoices',
  contact: 'contacts',
  product: 'products',
  voice: 'voice commands today',
  chat: 'chat messages today',
};

export default function PaywallModal({ open, onClose, limitType, current, max }: Props) {
  const navigate = useNavigate();

  if (!open) return null;

  const label = LIMIT_LABELS[limitType] || limitType;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[380px] bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden animate-scale-up">
        {/* Accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#c8ee44] to-[#a3c428]" />

        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 z-10">
          <X size={18} className="text-neutral-400" />
        </button>

        <div className="px-6 pt-6 pb-7 text-center">
          {/* Crown icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c8ee44] to-[#a3c428] flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(200,238,68,0.3)]">
            <Crown size={24} className="text-black" />
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
            Free Limit Reached
          </h2>

          <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-2">
            You've used <span className="font-bold text-neutral-900 dark:text-white">{current}/{max}</span> {label} on the Free plan.
          </p>

          <p className="text-xs text-neutral-400 dark:text-zinc-500 mb-6">
            Upgrade to Pro for unlimited access to all features.
          </p>

          {/* What you get */}
          <div className="glass-card p-4 text-left mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8fb02e] dark:text-[#c8ee44] mb-2">
              PRO INCLUDES
            </p>
            <div className="space-y-2">
              {[
                'Unlimited transactions & invoices',
                'Unlimited contacts & products',
                'All reports & AI insights',
                'Unlimited voice & chat AI',
                'WhatsApp notifications',
                '2 team members',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#c8ee44]/20 flex items-center justify-center">
                    <span className="text-[8px] text-[#8fb02e] dark:text-[#c8ee44]">✓</span>
                  </div>
                  <span className="text-xs text-neutral-700 dark:text-zinc-300">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); navigate('/subscription'); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
              bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
              shadow-[0_4px_20px_rgba(200,238,68,0.3)] active:scale-[0.98] transition-all"
          >
            <Crown size={16} /> Upgrade to Pro <ArrowRight size={16} />
          </button>

          <button onClick={onClose}
            className="mt-3 text-xs font-medium text-neutral-400 dark:text-zinc-600">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}