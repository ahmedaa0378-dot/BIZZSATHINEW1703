import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
    let query = supabase
      .from('distributors')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (city) query = query.ilike('city', `%${city}%`);
    if (category) query = query.contains('categories', [category]);

    const { data } = await query;
    set({ loading: false });
    if (data) set({ distributors: data as Distributor[] });
  },

  rateDistributor: async (distributorId, userId, rating) => {
    // Upsert rating
    const { error: rateErr } = await supabase
      .from('distributor_ratings')
      .upsert({ distributor_id: distributorId, user_id: userId, rating }, { onConflict: 'distributor_id,user_id' });

    if (rateErr) return false;

    // Recalculate average
    const { data: ratings } = await supabase
      .from('distributor_ratings')
      .select('rating')
      .eq('distributor_id', distributorId);

    if (ratings) {
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      await supabase
        .from('distributors')
        .update({ rating: Math.round(avg * 10) / 10, rating_count: ratings.length })
        .eq('id', distributorId);

      set({
        distributors: get().distributors.map((d) =>
          d.id === distributorId ? { ...d, rating: Math.round(avg * 10) / 10, rating_count: ratings.length } : d
        ),
      });
    }
    return true;
  },

  addDistributor: async (dist) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('distributors')
      .insert(dist)
      .select()
      .single();

    set({ loading: false });
    if (!error && data) {
      set({ distributors: [...get().distributors, data as Distributor] });
      return data as Distributor;
    }
    return null;
  },
}));

export const DISTRIBUTOR_CATEGORIES = [
  'FMCG', 'Grocery', 'Electronics', 'Mobile', 'Clothing', 'Textiles',
  'Pharmacy', 'Medical', 'Hardware', 'Tools', 'Stationery', 'Cosmetics',
  'Food & Beverage', 'Building Materials', 'Auto Parts', 'Other',
];
