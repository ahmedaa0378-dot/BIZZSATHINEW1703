import { create } from 'zustand';

interface AuthStore {
  user: null | { id: string; email: string };
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setUser: (user: AuthStore['user']) => void;
  setOnboarded: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnboarded: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOnboarded: (v) => set({ isOnboarded: v }),
  logout: () => set({ user: null, isAuthenticated: false, isOnboarded: false }),
}));

interface BusinessStore {
  business: null | {
    id: string;
    name: string;
    type: string;
    category: string;
    ownerName: string;
    subscriptionTier: 'trial' | 'pro' | 'business';
    trialEndsAt: string | null;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
    isSuperAdmin: boolean;
  };
  setBusiness: (b: BusinessStore['business']) => void;
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  business: null,
  setBusiness: (business) => set({ business }),
}));

// ─── Subscription Helpers ─────────────────────────────────────────────────────

// Is the user on an active paid or trial plan?
export function hasAccess(business: BusinessStore['business']): boolean {
  if (!business) return false;
  if ((business as any).isSuperAdmin) return true;
  
  // Active paid plan
  if ((business.subscriptionTier === 'pro' || business.subscriptionTier === 'business')) {
    // If cancelled, check if current period still valid
    if ((business as any).subscriptionStatus === 'cancelled') {
      const periodEnd = (business as any).currentPeriodEnd;
      if (periodEnd && new Date(periodEnd) > new Date()) return true;
      return false;
    }
    return true;
  }
  
  // Trial
  if (business.subscriptionTier === 'trial' && business.trialEndsAt) {
    return new Date(business.trialEndsAt) > new Date();
  }
  return false;
}

// How many days left in trial (returns 0 if expired or not on trial)
export function trialDaysLeft(business: BusinessStore['business']): number {
  if (!business?.trialEndsAt) return 0;
  const days = Math.ceil((new Date(business.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

// Max users allowed on this plan
export function maxUsers(business: BusinessStore['business']): number {
  if (!business) return 1;
  if (business.subscriptionTier === 'business') return 5;
  return 1;
}

// Display label for current plan
export function planLabel(business: BusinessStore['business']): string {
  if (!business) return 'Trial';
  if (business.isSuperAdmin) return '⚡ Super Admin';
  if (business.subscriptionTier === 'pro') return 'Pro';
  if (business.subscriptionTier === 'business') return 'Business';
  const days = trialDaysLeft(business);
  if (days > 0) return `Trial — ${days}d left`;
  return 'Trial Expired';
}
