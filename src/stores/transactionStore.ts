import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  business_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category_id: string | null;
  category_name: string;
  payment_method_id: string | null;
  payment_method_name: string;
  contact_id: string | null;
  contact_name: string | null;
  description: string | null;
  receipt_url: string | null;
  payment_status: 'paid' | 'unpaid' | 'partial';
  tags: string[];
  transaction_date: string;
  created_at: string;
}

export interface DashboardStats {
  total_income: number;
  total_expense: number;
  profit: number;
  transaction_count: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
}

interface TransactionStore {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  dashboardStats: DashboardStats | null;
  cashInHand: number;
  loading: boolean;
  
  fetchTransactions: (businessId: string) => Promise<void>;
  fetchCategories: (businessId: string) => Promise<void>;
  fetchPaymentMethods: (businessId: string) => Promise<void>;
  fetchDashboardStats: (businessId: string, startDate: string, endDate: string) => Promise<void>;
  fetchCashInHand: (businessId: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  categories: [],
  paymentMethods: [],
  dashboardStats: null,
  cashInHand: 0,
  loading: false,

  fetchTransactions: async (businessId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      set({ transactions: data as Transaction[] });
    }
  },

  fetchCategories: async (businessId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, icon')
      .eq('business_id', businessId)
      .order('sort_order');

    if (!error && data) {
      set({ categories: data as Category[] });
    }
  },

  fetchPaymentMethods: async (businessId: string) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, name, is_default, sort_order')
      .eq('business_id', businessId)
      .order('sort_order');

    if (!error && data) {
      set({ paymentMethods: data as PaymentMethod[] });
    }
  },

  fetchDashboardStats: async (businessId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', {
        p_business_id: businessId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (!error && data && data.length > 0) {
      set({ dashboardStats: data[0] as DashboardStats });
    } else {
      set({ dashboardStats: { total_income: 0, total_expense: 0, profit: 0, transaction_count: 0 } });
    }
  },

  fetchCashInHand: async (businessId: string) => {
    const { data, error } = await supabase
      .rpc('get_cash_in_hand', { p_business_id: businessId });

    if (!error && data !== null) {
      set({ cashInHand: Number(data) });
    }
  },

  addTransaction: async (tx) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('transactions')
      .insert(tx)
      .select()
      .single();

    set({ loading: false });

    if (error) {
      console.error('Add transaction error:', error);
      return null;
    }

    // Prepend to list
    const current = get().transactions;
    set({ transactions: [data as Transaction, ...current] });
    return data as Transaction;
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      set({ transactions: get().transactions.filter((t) => t.id !== id) });
      return true;
    }
    return false;
  },
}));
