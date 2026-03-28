import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToastStore } from './toastStore';

export interface CategoryBreakdown {
  category_name: string;
  total: number;
  count: number;
}

export interface DailyTrend {
  day: string;
  income: number;
  expense: number;
}

export interface AgingItem {
  customer_name: string;
  invoice_number: string;
  grand_total: number;
  balance_due: number;
  days_overdue: number;
  aging_bucket: string;
}

export interface DashboardStats {
  total_income: number;
  total_expense: number;
  profit: number;
  transaction_count: number;
}

interface ReportsStore {
  stats: DashboardStats | null;
  prevStats: DashboardStats | null;
  expenseBreakdown: CategoryBreakdown[];
  incomeBreakdown: CategoryBreakdown[];
  dailyTrend: DailyTrend[];
  receivablesAging: AgingItem[];
  loading: boolean;

  fetchPnL: (businessId: string, start: string, end: string) => Promise<void>;
  fetchPrevPnL: (businessId: string, start: string, end: string) => Promise<void>;
  fetchCategoryBreakdown: (businessId: string, type: string, start: string, end: string) => Promise<void>;
  fetchDailyTrend: (businessId: string, start: string, end: string) => Promise<void>;
  fetchReceivablesAging: (businessId: string) => Promise<void>;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  stats: null,
  prevStats: null,
  expenseBreakdown: [],
  incomeBreakdown: [],
  dailyTrend: [],
  receivablesAging: [],
  loading: false,

  fetchPnL: async (businessId, start, end) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_business_id: businessId,
        p_start_date: start,
        p_end_date: end,
      });
      if (error) throw error;
      set({ loading: false });
      if (data && data.length > 0) {
        set({ stats: data[0] as DashboardStats });
      } else {
        set({ stats: { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 } });
      }
    } catch (err) {
      console.error('Failed to fetch P&L:', err);
      useToastStore.getState().addToast('Failed to load report data', 'error');
      set({ loading: false });
    }
  },

  fetchPrevPnL: async (businessId, start, end) => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_business_id: businessId,
        p_start_date: start,
        p_end_date: end,
      });
      if (error) throw error;
      if (data && data.length > 0) {
        set({ prevStats: data[0] as DashboardStats });
      } else {
        set({ prevStats: { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 } });
      }
    } catch (err) {
      console.error('Failed to fetch previous P&L:', err);
      useToastStore.getState().addToast('Failed to load report data', 'error');
    }
  },

  fetchCategoryBreakdown: async (businessId, type, start, end) => {
    try {
      const { data, error } = await supabase.rpc('get_category_breakdown', {
        p_business_id: businessId,
        p_type: type,
        p_start_date: start,
        p_end_date: end,
      });
      if (error) throw error;
      if (data) {
        if (type === 'expense') set({ expenseBreakdown: data as CategoryBreakdown[] });
        else set({ incomeBreakdown: data as CategoryBreakdown[] });
      }
    } catch (err) {
      console.error('Failed to fetch category breakdown:', err);
      useToastStore.getState().addToast('Failed to load report data', 'error');
    }
  },

  fetchDailyTrend: async (businessId, start, end) => {
    try {
      const { data, error } = await supabase.rpc('get_daily_trend', {
        p_business_id: businessId,
        p_start_date: start,
        p_end_date: end,
      });
      if (error) throw error;
      if (data) {
        set({ dailyTrend: data as DailyTrend[] });
      }
    } catch (err) {
      console.error('Failed to fetch daily trend:', err);
      useToastStore.getState().addToast('Failed to load report data', 'error');
    }
  },

  fetchReceivablesAging: async (businessId) => {
    try {
      const { data, error } = await supabase.rpc('get_receivables_aging', {
        p_business_id: businessId,
      });
      if (error) throw error;
      if (data) {
        set({ receivablesAging: data as AgingItem[] });
      }
    } catch (err) {
      console.error('Failed to fetch receivables aging:', err);
      useToastStore.getState().addToast('Failed to load report data', 'error');
    }
  },
}));

// Period helpers
export function getDateRange(period: string): { start: string; end: string; prevStart: string; prevEnd: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 7);
    return { start: start.toISOString().split('T')[0], end, prevStart: prevStart.toISOString().split('T')[0], prevEnd: prevEnd.toISOString().split('T')[0] };
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);
    return { start: start.toISOString().split('T')[0], end, prevStart: prevStart.toISOString().split('T')[0], prevEnd: prevEnd.toISOString().split('T')[0] };
  }

  if (period === 'quarter') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), qMonth, 1);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevQMonth = Math.floor(prevEnd.getMonth() / 3) * 3;
    const prevStart = new Date(prevEnd.getFullYear(), prevQMonth, 1);
    return { start: start.toISOString().split('T')[0], end, prevStart: prevStart.toISOString().split('T')[0], prevEnd: prevEnd.toISOString().split('T')[0] };
  }

  if (period === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(now.getFullYear() - 1, 11, 31);
    return { start: start.toISOString().split('T')[0], end, prevStart: prevStart.toISOString().split('T')[0], prevEnd: prevEnd.toISOString().split('T')[0] };
  }

  // today
  const prevDate = new Date(now);
  prevDate.setDate(prevDate.getDate() - 1);
  return { start: end, end, prevStart: prevDate.toISOString().split('T')[0], prevEnd: prevDate.toISOString().split('T')[0] };
}
