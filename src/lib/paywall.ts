import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useBusinessStore } from '../stores/appStore';

// ===== TIER LIMITS =====
export const TIER_LIMITS = {
  free: {
    transactions_per_month: 50,
    invoices_total: 10,
    contacts_total: 25,
    products_total: 20,
    voice_per_day: 10,
    chat_per_day: 20,
    reports: false,
    insights: false,
    whatsapp: false,
    marketing: false,
    team_members: 0,
  },
  pro: {
    transactions_per_month: Infinity,
    invoices_total: Infinity,
    contacts_total: Infinity,
    products_total: Infinity,
    voice_per_day: Infinity,
    chat_per_day: Infinity,
    reports: true,
    insights: true,
    whatsapp: true,
    marketing: true,
    team_members: 2,
  },
  business: {
    transactions_per_month: Infinity,
    invoices_total: Infinity,
    contacts_total: Infinity,
    products_total: Infinity,
    voice_per_day: Infinity,
    chat_per_day: Infinity,
    reports: true,
    insights: true,
    whatsapp: true,
    marketing: true,
    team_members: 5,
  },
};

export type TierName = 'free' | 'pro' | 'business';

// ===== GET EFFECTIVE TIER =====
// If trial hasn't expired, treat as 'pro'
export function getEffectiveTier(tier: string, trialEndsAt: string | null): TierName {
  if (tier === 'pro' || tier === 'business') return tier as TierName;
  
  // Check if trial is still active
  if (trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > new Date()) return 'pro'; // trial active = pro features
  }
  
  return 'free';
}

// ===== TRIAL INFO =====
export function getTrialInfo(trialEndsAt: string | null): {
  isTrialActive: boolean;
  daysLeft: number;
  trialExpired: boolean;
} {
  if (!trialEndsAt) return { isTrialActive: false, daysLeft: 0, trialExpired: true };
  
  const trialEnd = new Date(trialEndsAt);
  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  
  return {
    isTrialActive: daysLeft > 0,
    daysLeft,
    trialExpired: daysLeft <= 0,
  };
}

// ===== CHECK LIMIT =====
export type LimitType = 'transaction' | 'invoice' | 'contact' | 'product' | 'voice' | 'chat';

export async function checkLimit(
  businessId: string,
  limitType: LimitType,
  tier: TierName
): Promise<{ allowed: boolean; current: number; max: number; tierName: TierName }> {
  const limits = TIER_LIMITS[tier];
  
  switch (limitType) {
    case 'transaction': {
      // Count this month's transactions
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const startDate = firstOfMonth.toISOString().split('T')[0];
      
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('transaction_date', startDate);
      
      const current = count || 0;
      const max = limits.transactions_per_month;
      return { allowed: current < max, current, max, tierName: tier };
    }
    
    case 'invoice': {
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId);
      
      const current = count || 0;
      const max = limits.invoices_total;
      return { allowed: current < max, current, max, tierName: tier };
    }
    
    case 'contact': {
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId);
      
      const current = count || 0;
      const max = limits.contacts_total;
      return { allowed: current < max, current, max, tierName: tier };
    }
    
    case 'product': {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);
      
      const current = count || 0;
      const max = limits.products_total;
      return { allowed: current < max, current, max, tierName: tier };
    }
    
    case 'voice':
    case 'chat': {
      // For voice/chat we use a simple localStorage counter per day
      const today = new Date().toISOString().split('T')[0];
      const key = `bizzsathi_${limitType}_${today}`;
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      const max = limitType === 'voice' ? limits.voice_per_day : limits.chat_per_day;
      return { allowed: current < max, current, max, tierName: tier };
    }
    
    default:
      return { allowed: true, current: 0, max: Infinity, tierName: tier };
  }
}

// Increment daily counter for voice/chat
export function incrementDailyCounter(type: 'voice' | 'chat') {
  const today = new Date().toISOString().split('T')[0];
  const key = `bizzsathi_${type}_${today}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(current + 1));
}

// ===== HOOK =====
export function usePaywall() {
  const { business } = useBusinessStore();
  
  const tier = getEffectiveTier(
    (business as any)?.subscriptionTier || 'free',
    (business as any)?.trialEndsAt || null
  );
  
  const trialInfo = getTrialInfo((business as any)?.trialEndsAt || null);
  const limits = TIER_LIMITS[tier];
  const isPro = tier === 'pro' || tier === 'business';
  
  const check = async (limitType: LimitType) => {
    if (!business?.id) return { allowed: true, current: 0, max: Infinity, tierName: tier };
    if (isPro) return { allowed: true, current: 0, max: Infinity, tierName: tier };
    return checkLimit(business.id, limitType, tier);
  };
  
  const canUseFeature = (feature: 'reports' | 'insights' | 'whatsapp' | 'marketing') => {
    return limits[feature];
  };
  
  return {
    tier,
    isPro,
    trialInfo,
    limits,
    check,
    canUseFeature,
    incrementDailyCounter,
  };
}