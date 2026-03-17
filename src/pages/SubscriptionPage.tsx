import { useState } from 'react';
import {
  ArrowLeft, Check, X, Crown, Sparkles, Zap, Star,
  Shield, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useBusinessStore } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

interface PlanFeature {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
}

const FEATURES: PlanFeature[] = [
  { name: 'Transactions', free: '50/month', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Invoices', free: '10/month', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Contacts', free: '25', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Products', free: '20', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Reports', free: 'Basic', pro: 'All 8', business: 'All 8' },
  { name: 'Export (PDF/Excel)', free: false, pro: true, business: true },
  { name: 'Invoice Templates', free: '1', pro: 'All 3', business: 'All 3' },
  { name: 'Voice AI', free: '10/month', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'AI Chatbot', free: '20 msgs/month', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'AI Insights', free: false, pro: true, business: true },
  { name: 'WhatsApp Integration', free: false, pro: true, business: true },
  { name: 'Online Payments', free: false, pro: true, business: true },
  { name: 'Marketing Suite', free: false, pro: false, business: true },
  { name: 'Distributor Discovery', free: false, pro: false, business: true },
  { name: 'Team Members', free: '1 (Owner)', pro: '2 users', business: '5 users' },
  { name: 'Invoice Branding', free: 'BizzSathi logo', pro: 'No branding', business: 'No branding' },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '',
    icon: Zap,
    color: 'from-neutral-500 to-neutral-600',
    desc: 'Get started for free',
    badge: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    period: '/month',
    icon: Star,
    color: 'from-[#c8ee44] to-[#a3c428]',
    desc: 'For growing businesses',
    badge: 'Popular',
  },
  {
    id: 'business',
    name: 'Business',
    price: 999,
    period: '/month',
    icon: Crown,
    color: 'from-accent to-accent-dark',
    desc: 'Complete business OS',
    badge: 'Best Value',
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { business } = useBusinessStore();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showFeatures, setShowFeatures] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const currentTier = business?.tier || 'free';

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    setUpgrading(true);
    // In production, this would open Razorpay payment
    // For now, just update the tier
    if (business?.id) {
      await supabase
        .from('businesses')
        .update({ subscription_tier: planId })
        .eq('id', business.id);
    }
    setUpgrading(false);
    alert(`Upgrade to ${planId} plan coming soon! Razorpay integration needed.`);
  };

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Subscription</h1>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-5 animate-fade-in">

        {/* Current Plan */}
        <div className="premium-card p-5">
          <div className="relative z-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} className="text-accent" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-1">Current Plan</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">{currentTier}</p>
            <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-1">7-day Pro trial active</p>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentTier === plan.id;
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  'w-full p-5 rounded-3xl text-left transition-all active:scale-[0.98] relative overflow-hidden',
                  isSelected
                    ? 'bg-gradient-to-br ' + plan.color + ' text-white shadow-lg'
                    : 'glass-card'
                )}>
                {plan.badge && (
                  <span className={cn('absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-accent/15 text-accent-dark dark:text-accent')}>
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                    isSelected ? 'bg-white/20' : 'bg-neutral-100 dark:bg-white/5')}>
                    <Icon size={20} className={isSelected ? 'text-white' : 'text-neutral-500 dark:text-zinc-400'} />
                  </div>
                  <div>
                    <p className={cn('text-lg font-bold', isSelected ? 'text-white' : 'text-neutral-900 dark:text-white')}>
                      {plan.name}
                    </p>
                    <p className={cn('text-xs', isSelected ? 'text-white/70' : 'text-neutral-500 dark:text-zinc-500')}>
                      {plan.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className={cn('text-2xl font-bold', isSelected ? 'text-white' : 'text-neutral-900 dark:text-white')}>Free</span>
                  ) : (
                    <>
                      <span className={cn('text-2xl font-bold tabular-nums', isSelected ? 'text-white' : 'text-neutral-900 dark:text-white')}>
                        ₹{plan.price}
                      </span>
                      <span className={cn('text-sm', isSelected ? 'text-white/70' : 'text-neutral-500 dark:text-zinc-500')}>
                        {plan.period}
                      </span>
                    </>
                  )}
                </div>

                {isCurrent && (
                  <span className={cn('mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                    isSelected ? 'text-white/80' : 'text-emerald-500')}>
                    <Shield size={12} /> Current Plan
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upgrade Button */}
        {selectedPlan !== 'free' && selectedPlan !== currentTier && (
          <button onClick={() => handleUpgrade(selectedPlan)} disabled={upgrading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
              bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
              shadow-glow-blue active:scale-[0.98] transition-all disabled:opacity-50">
            {upgrading ? <Loader2 size={18} className="animate-spin" /> :
              <><Crown size={18} /> Upgrade to {PLANS.find((p) => p.id === selectedPlan)?.name}</>}
          </button>
        )}

        {/* Feature Comparison */}
        <button onClick={() => setShowFeatures(!showFeatures)}
          className="w-full text-center text-sm font-semibold text-blue-500 py-2">
          {showFeatures ? 'Hide' : 'Show'} feature comparison
        </button>

        {showFeatures && (
          <div className="glass-card overflow-hidden">
            <div className="grid grid-cols-4 gap-0 text-center border-b border-neutral-200 dark:border-white/10 py-2 px-2">
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-500 text-left">Feature</span>
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-500">Free</span>
              <span className="text-[10px] font-semibold text-blue-500">Pro</span>
              <span className="text-[10px] font-semibold text-accent-dark dark:text-accent">Business</span>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} className="grid grid-cols-4 gap-0 text-center py-2 px-2 border-b border-neutral-100 dark:border-white/5 last:border-0">
                <span className="text-[10px] text-neutral-700 dark:text-zinc-300 text-left">{f.name}</span>
                <FeatureCell value={f.free} />
                <FeatureCell value={f.pro} />
                <FeatureCell value={f.business} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) return <Check size={14} className="mx-auto text-emerald-500" />;
  if (value === false) return <X size={14} className="mx-auto text-neutral-300 dark:text-zinc-700" />;
  return <span className="text-[10px] text-neutral-700 dark:text-zinc-300">{value}</span>;
}
