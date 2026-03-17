import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
    const { data } = await supabase.rpc('get_dashboard_stats', {
      p_business_id: businessId,
      p_start_date: start,
      p_end_date: end,
    });
    set({ loading: false });
    if (data && data.length > 0) {
      set({ stats: data[0] as DashboardStats });
    } else {
      set({ stats: { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 } });
    }
  },

  fetchPrevPnL: async (businessId, start, end) => {
    const { data } = await supabase.rpc('get_dashboard_stats', {
      p_business_id: businessId,
      p_start_date: start,
      p_end_date: end,
    });
    if (data && data.length > 0) {
      set({ prevStats: data[0] as DashboardStats });
    } else {
      set({ prevStats: { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 } });
    }
  },

  fetchCategoryBreakdown: async (businessId, type, start, end) => {
    const { data } = await supabase.rpc('get_category_breakdown', {
      p_business_id: businessId,
      p_type: type,
      p_start_date: start,
      p_end_date: end,
    });
    if (data) {
      if (type === 'expense') set({ expenseBreakdown: data as CategoryBreakdown[] });
      else set({ incomeBreakdown: data as CategoryBreakdown[] });
    }
  },

  fetchDailyTrend: async (businessId, start, end) => {
    const { data } = await supabase.rpc('get_daily_trend', {
      p_business_id: businessId,
      p_start_date: start,
      p_end_date: end,
    });
    if (data) {
      set({ dailyTrend: data as DailyTrend[] });
    }
  },

  fetchReceivablesAging: async (businessId) => {
    const { data } = await supabase.rpc('get_receivables_aging', {
      p_business_id: businessId,
    });
    if (data) {
      set({ receivablesAging: data as AgingItem[] });
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
