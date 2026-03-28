import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToastStore } from './toastStore';

export interface Distributor {
  id: string;
  business_id: string | null;
  name: string;
  contact_person: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: string[];
  products: string | null;
  min_order_amount: number;
  delivers: boolean;
  delivery_radius_km: number | null;
  operating_hours: string | null;
  rating: number;
  rating_count: number;
  photos: string[];
  is_verified: boolean;
  is_self_listed: boolean;
  is_active: boolean;
  created_at: string;
}

interface DistributorStore {
  distributors: Distributor[];
  loading: boolean;
  fetchDistributors: (city?: string, category?: string) => Promise<void>;
  rateDistributor: (distributorId: string, userId: string, rating: number) => Promise<boolean>;
  addDistributor: (dist: Partial<Distributor>) => Promise<Distributor | null>;
}

export const useDistributorStore = create<DistributorStore>((set, get) => ({
  distributors: [],
  loading: false,

  fetchDistributors: async (city, category) => {
    set({ loading: true });
    try {
      let query = supabase
        .from('distributors')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (city) query = query.ilike('city', `%${city}%`);
      if (category) query = query.contains('categories', [category]);

      const { data, error } = await query;
      if (error) throw error;
      set({ loading: false });
      if (data) set({ distributors: data as Distributor[] });
    } catch (err) {
      console.error('Failed to fetch distributors:', err);
      useToastStore.getState().addToast('Failed to load distributors', 'error');
      set({ loading: false });
    }
  },

  rateDistributor: async (distributorId, userId, rating) => {
    try {
      // Upsert rating
      const { error: rateErr } = await supabase
        .from('distributor_ratings')
        .upsert({ distributor_id: distributorId, user_id: userId, rating }, { onConflict: 'distributor_id,user_id' });
      if (rateErr) throw rateErr;

      // Recalculate average
      const { data: ratings, error: fetchErr } = await supabase
        .from('distributor_ratings')
        .select('rating')
        .eq('distributor_id', distributorId);
      if (fetchErr) throw fetchErr;

      if (ratings) {
        const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
        const { error: updateErr } = await supabase
          .from('distributors')
          .update({ rating: Math.round(avg * 10) / 10, rating_count: ratings.length })
          .eq('id', distributorId);
        if (updateErr) throw updateErr;

        set({
          distributors: get().distributors.map((d) =>
            d.id === distributorId ? { ...d, rating: Math.round(avg * 10) / 10, rating_count: ratings.length } : d
          ),
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to rate distributor:', err);
      useToastStore.getState().addToast('Failed to save rating', 'error');
      return false;
    }
  },

  addDistributor: async (dist) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('distributors')
        .insert(dist)
        .select()
        .single();
      if (error) throw error;
      set({ loading: false });
      if (data) {
        set({ distributors: [...get().distributors, data as Distributor] });
        return data as Distributor;
      }
      return null;
    } catch (err) {
      console.error('Failed to add distributor:', err);
      useToastStore.getState().addToast('Failed to add distributor', 'error');
      set({ loading: false });
      return null;
    }
  },
}));

export const DISTRIBUTOR_CATEGORIES = [
  'FMCG', 'Grocery', 'Electronics', 'Mobile', 'Clothing', 'Textiles',
  'Pharmacy', 'Medical', 'Hardware', 'Tools', 'Stationery', 'Cosmetics',
  'Food & Beverage', 'Building Materials', 'Auto Parts', 'Other',
];
