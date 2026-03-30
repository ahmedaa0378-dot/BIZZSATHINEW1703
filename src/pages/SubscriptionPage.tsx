import { useState } from 'react';
import {
  ArrowLeft, Check, Crown, Sparkles, Star, Shield, Loader2, Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useBusinessStore, useAuthStore, hasAccess, trialDaysLeft, planLabel } from '../stores/appStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import { useToastStore } from '../stores/toastStore';

const PLAN_IDS = {
  pro_monthly: 'plan_SXakNGPsC7um2m',
  pro_annual: 'plan_SXaldi2z7qW8M4',
  business_monthly: 'plan_SXamR8uvMGICmv',
  business_annual: 'plan_SXanE1PDvkcnia',
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PRO_FEATURES = [
  'Unlimited transactions & invoices',
  'Unlimited contacts & products',
  'All 8 reports + PDF/Excel export',
  'Voice AI & AI Chatbot — unlimited',
  'AI Insights & recommendations',
  'Marketing Suite',
  'Distributor Discovery',
  'WhatsApp notifications',
  'Online payments (Razorpay)',
  'No BizzSathi branding on invoices',
  '1 user (owner)',
];

const BUSINESS_EXTRAS = [
  'Everything in Pro',
  'Up to 5 team members',
  'Role-based access (Manager, Staff, Accountant)',
  'Priority support',
];

export default function SubscriptionPage() {
const navigate = useNavigate();
  const { business, setBusiness } = useBusinessStore();
  const { user } = useAuthStore();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const toast = useToastStore();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const currentTier = business?.subscriptionTier || 'trial';
  const daysLeft = trialDaysLeft(business);
  const access = hasAccess(business);
  const label = planLabel(business);

  const PRICES = {
    pro: { monthly: 499, annual: 4790 },
    business: { monthly: 699, annual: 6710 },
  };

const handleUpgrade = async (tier: 'pro' | 'business') => {
    if (!business?.id || !user?.email) return;
    setUpgrading(tier);
    try {
      const planKey = `${tier}_${billing}` as keyof typeof PLAN_IDS;
      const plan_id = PLAN_IDS[planKey];

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          plan_id,
          business_id: business.id,
          user_email: user.email,
          user_name: business.ownerName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create subscription');
      }

      const { subscription_id, key_id } = await res.json();

      const options = {
        key: key_id,
        subscription_id,
        name: 'BizSaathi',
        description: `${tier === 'pro' ? 'Pro' : 'Business'} Plan — ${billing === 'monthly' ? 'Monthly' : 'Annual'}`,
        prefill: {
          name: business.ownerName || '',
          email: user.email || '',
        },
        theme: { color: '#c8ee44' },
        handler: async () => {
          toast.addToast('Payment successful! Upgrading your plan...', 'success');
          setTimeout(async () => {
            const { data: biz } = await supabase
              .from('businesses')
              .select('subscription_tier, trial_ends_at, subscription_status, current_period_end')
              .eq('id', business.id)
              .single();
            if (biz) {
              setBusiness({ ...business, subscriptionTier: biz.subscription_tier || tier });
              toast.addToast(`You're now on the ${tier === 'pro' ? 'Pro' : 'Business'} plan!`, 'success');
            }
          }, 3000);
        },
        modal: {
          ondismiss: () => {
            setUpgrading(null);
            toast.addToast('Payment cancelled', 'info');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.addToast(response.error?.description || 'Payment failed. Please try again.', 'error');
        setUpgrading(null);
      });
      rzp.open();
    } catch (err: any) {
      toast.addToast(err.message || 'Something went wrong', 'error');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Subscription</h1>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-5 animate-fade-in">

        {/* Current Plan Status */}
        <div className="premium-card p-5">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              {currentTier === 'pro' ? <Star size={24} className="text-accent" /> :
               currentTier === 'business' ? <Crown size={24} className="text-accent" /> :
               <Sparkles size={24} className="text-accent" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500">Current Plan</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white capitalize mt-0.5">{label}</p>
              {currentTier === 'trial' && daysLeft > 0 && (
                <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">
                  Full access until trial ends
                </p>
              )}
              {currentTier === 'trial' && daysLeft === 0 && (
                <p className="text-xs text-red-500 mt-0.5">Upgrade to continue using BizzSathi</p>
              )}
              {(currentTier === 'pro' || currentTier === 'business') && (
                <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
                  <Shield size={11} /> Active subscription
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trial Banner */}
        {currentTier === 'trial' && daysLeft > 0 && (
          <div className="glass-card p-4 border border-[#c8ee44]/30 flex items-center gap-3">
            <Zap size={18} className="text-[#c8ee44] flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial
              </p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">
                Upgrade now to keep full access after trial ends
              </p>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center">
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-white/5 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                billing === 'monthly'
                  ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-zinc-500')}>
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
                billing === 'annual'
                  ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-zinc-500')}>
              Annual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#c8ee44] text-black">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className={cn('rounded-3xl overflow-hidden',
          currentTier === 'pro' ? 'ring-2 ring-[#c8ee44]' : '')}>
          <div className="bg-gradient-to-br from-[#c8ee44] to-[#a3c428] p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-black" />
                <span className="text-lg font-bold text-black">Pro</span>
              </div>
              {currentTier === 'pro' && (
                <span className="px-2.5 py-0.5 rounded-full bg-black/15 text-black text-[10px] font-bold">
                  Current Plan
                </span>
              )}
              {currentTier !== 'pro' && (
                <span className="px-2.5 py-0.5 rounded-full bg-black/15 text-black text-[10px] font-bold">
                  Popular
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-black tabular-nums">
                ₹{billing === 'monthly' ? PRICES.pro.monthly : PRICES.pro.annual}
              </span>
              <span className="text-black/70 text-sm">
                /{billing === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billing === 'annual' && (
              <p className="text-black/70 text-xs mt-0.5">₹{PRICES.pro.monthly * 12 - PRICES.pro.annual} saved vs monthly</p>
            )}
          </div>
          <div className="glass-card rounded-t-none p-4 space-y-2">
            {PRO_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check size={14} className="text-[#c8ee44] flex-shrink-0" />
                <span className="text-xs text-neutral-700 dark:text-zinc-300">{f}</span>
              </div>
            ))}
            {currentTier !== 'pro' && (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading === 'pro'}
                className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-[#c8ee44] to-[#a3c428]
                  text-black font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50">
                {upgrading === 'pro' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>

        {/* Business Plan */}
        <div className={cn('rounded-3xl overflow-hidden',
          currentTier === 'business' ? 'ring-2 ring-[#c8ee44]' : '')}>
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-white/10 dark:to-white/5 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-[#c8ee44]" />
                <span className="text-lg font-bold text-white">Business</span>
              </div>
              {currentTier === 'business' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#c8ee44]/20 text-[#c8ee44] text-[10px] font-bold">
                  Current Plan
                </span>
              )}
              {currentTier !== 'business' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#c8ee44]/20 text-[#c8ee44] text-[10px] font-bold">
                  Best Value
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tabular-nums">
                ₹{billing === 'monthly' ? PRICES.business.monthly : PRICES.business.annual}
              </span>
              <span className="text-white/60 text-sm">
                /{billing === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billing === 'annual' && (
              <p className="text-white/50 text-xs mt-0.5">₹{PRICES.business.monthly * 12 - PRICES.business.annual} saved vs monthly</p>
            )}
          </div>
          <div className="glass-card rounded-t-none p-4 space-y-2">
            {BUSINESS_EXTRAS.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check size={14} className="text-[#c8ee44] flex-shrink-0" />
                <span className="text-xs text-neutral-700 dark:text-zinc-300">{f}</span>
              </div>
            ))}
            {currentTier !== 'business' && (
              <button
                onClick={() => handleUpgrade('business')}
                disabled={upgrading === 'business'}
                className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-neutral-800 to-neutral-900
                  dark:from-white/10 dark:to-white/5 border border-[#c8ee44]/30
                  text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50">
                {upgrading === 'business' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Upgrade to Business'}
              </button>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="glass-card p-4 border-l-[3px] border-l-blue-500">
          <p className="text-xs text-neutral-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-white">Razorpay payments coming soon.</strong>{' '}
            Contact us at support@bizzsathi.com to upgrade manually and get instant access.
          </p>
        </div>

      </div>
    </PageWrapper>
  );
}