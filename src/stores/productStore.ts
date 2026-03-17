import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  business_id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  buy_price: number;
  sell_price: number;
  gst_rate: number;
  hsn_code: string | null;
  current_stock: number;
  low_stock_threshold: number;
  image_url: string | null;
  barcode: string | null;
  location: string;
  is_active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment' | 'return_in' | 'return_out' | 'transfer';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockSummary {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_stock_value: number;
}

export type StockStatus = 'in_stock' | 'low' | 'out';

export function getStockStatus(product: Product): StockStatus {
  if (product.current_stock <= 0) return 'out';
  if (product.current_stock <= product.low_stock_threshold) return 'low';
  return 'in_stock';
}

interface ProductStore {
  products: Product[];
  movements: StockMovement[];
  summary: StockSummary | null;
  categories: string[];
  loading: boolean;

  fetchProducts: (businessId: string) => Promise<void>;
  fetchSummary: (businessId: string) => Promise<void>;
  fetchMovements: (productId: string) => Promise<void>;
  addProduct: (product: Partial<Product> & { business_id: string; name: string }) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  adjustStock: (businessId: string, productId: string, type: StockMovement['type'], quantity: number, notes?: string) => Promise<boolean>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  movements: [],
  summary: null,
  categories: [],
  loading: false,

  fetchProducts: async (businessId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');

    set({ loading: false });
    if (!error && data) {
      const products = data as Product[];
      set({ products });
      // Extract unique categories
      const cats = [...new Set(products.map((p) => p.category))].sort();
      set({ categories: cats });
    }
  },

  fetchSummary: async (businessId) => {
    const { data, error } = await supabase
      .rpc('get_stock_summary', { p_business_id: businessId });

    if (!error && data && data.length > 0) {
      set({ summary: data[0] as StockSummary });
    } else {
      set({ summary: { total_products: 0, low_stock_count: 0, out_of_stock_count: 0, total_stock_value: 0 } });
    }
  },

  fetchMovements: async (productId) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      set({ movements: data as StockMovement[] });
    }
  },

  addProduct: async (product) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    set({ loading: false });
    if (error) {
      console.error('Add product error:', error);
      return null;
    }
    const p = data as Product;
    set({ products: [...get().products, p].sort((a, b) => a.name.localeCompare(b.name)) });
    return p;
  },

  updateProduct: async (id, updates) => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (!error) {
      set({ products: get().products.map((p) => p.id === id ? { ...p, ...updates } as Product : p) });
      return true;
    }
    return false;
  },

  deleteProduct: async (id) => {
    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      set({ products: get().products.filter((p) => p.id !== id) });
      return true;
    }
    return false;
  },

  adjustStock: async (businessId, productId, type, quantity, notes) => {
    const product = get().products.find((p) => p.id === productId);
    if (!product) return false;

    const prevStock = Number(product.current_stock);
    let newStock: number;

    if (type === 'in' || type === 'return_in') {
      newStock = prevStock + quantity;
    } else if (type === 'out' || type === 'return_out') {
      newStock = prevStock - quantity;
    } else if (type === 'adjustment') {
      newStock = quantity; // Absolute value for adjustment
    } else {
      newStock = prevStock - quantity; // Transfer out
    }

    newStock = Math.max(0, newStock);

    // Update product stock
    const { error: updateErr } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', productId);

    if (updateErr) return false;

    // Record movement
    await supabase.from('stock_movements').insert({
      business_id: businessId,
      product_id: productId,
      type,
      quantity,
      previous_stock: prevStock,
      new_stock: newStock,
      notes: notes || null,
    });

    // Update local state
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, current_stock: newStock } : p
      ),
    });

    return true;
  },
}));

export const PRODUCT_CATEGORIES = [
  'General', 'Grocery', 'Electronics', 'Clothing', 'Pharmacy',
  'Hardware', 'Stationery', 'Cosmetics', 'Food & Beverage',
  'Mobile & Accessories', 'Footwear', 'Home & Kitchen', 'Other',
];

export const PRODUCT_UNITS = [
  'pcs', 'kg', 'gm', 'ltr', 'ml', 'mtr', 'ft',
  'box', 'dozen', 'pair', 'bundle', 'quintal', 'ton',
];
