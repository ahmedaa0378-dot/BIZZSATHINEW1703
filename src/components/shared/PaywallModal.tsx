import { X, Crown, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBusinessStore, trialDaysLeft } from '../../stores/appStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PaywallModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const days = trialDaysLeft(business);

  if (!open) return null;

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
          {/* Crown */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c8ee44] to-[#a3c428] flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(200,238,68,0.3)]">
            <Crown size={24} className="text-black" />
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
            {days === 0 ? 'Your Trial Has Expired' : 'Upgrade Required'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-6">
            {days === 0
              ? 'Your 14-day free trial has ended. Upgrade to continue using BizzSathi.'
              : 'This feature requires a Pro or Business plan.'}
          </p>

          {/* Plans */}
          <div className="space-y-3 mb-5 text-left">
            {/* Pro */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Pro</p>
                <p className="text-sm font-bold text-[#8fb02e] dark:text-[#c8ee44]">₹299/mo</p>
              </div>
              {[
                'All features — unlimited',
                'Voice & Chat AI',
                'WhatsApp notifications',
                '1 user',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 mt-1.5">
                  <Check size={12} className="text-[#c8ee44] flex-shrink-0" />
                  <span className="text-xs text-neutral-600 dark:text-zinc-400">{f}</span>
                </div>
              ))}
            </div>

            {/* Business */}
            <div className="glass-card p-4 border border-[#c8ee44]/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Business</p>
                <p className="text-sm font-bold text-[#8fb02e] dark:text-[#c8ee44]">₹699/mo</p>
              </div>
              {[
                'Everything in Pro',
                'Up to 5 team members',
                'Priority support',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 mt-1.5">
                  <Check size={12} className="text-[#c8ee44] flex-shrink-0" />
                  <span className="text-xs text-neutral-600 dark:text-zinc-400">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); navigate('/subscription'); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
              bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
              shadow-[0_4px_20px_rgba(200,238,68,0.3)] active:scale-[0.98] transition-all">
            <Crown size={16} /> View Plans <ArrowRight size={16} />
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
