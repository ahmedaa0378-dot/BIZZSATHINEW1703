import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  item_name: string;
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  document_type: string;
  invoice_number: string;
  invoice_prefix: string;
  contact_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_gstin: string | null;
  customer_state: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  is_gst_invoice: boolean;
  is_interstate: boolean;
  place_of_supply: string | null;
  status: string;
  notes: string | null;
  terms: string | null;
  template: string;
  show_upi_qr: boolean;
  created_at: string;
  items?: InvoiceItem[];
}

interface InvoiceStore {
  invoices: Invoice[];
  loading: boolean;
  fetchInvoices: (businessId: string) => Promise<void>;
  getInvoice: (id: string) => Promise<Invoice | null>;
  createInvoice: (invoice: Partial<Invoice>, items: InvoiceItem[]) => Promise<Invoice | null>;
  updateInvoiceStatus: (id: string, status: string) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;
  getNextNumber: (businessId: string, prefix?: string) => Promise<string>;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: [],
  loading: false,

  fetchInvoices: async (businessId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('business_id', businessId)
      .order('invoice_date', { ascending: false })
      .order('created_at', { ascending: false });

    set({ loading: false });
    if (!error && data) {
      set({ invoices: data as Invoice[] });
    }
  },

  getInvoice: async (id: string) => {
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invErr || !inv) return null;

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order');

    return { ...inv, items: items || [] } as Invoice;
  },

  createInvoice: async (invoice, items) => {
    set({ loading: true });

    // Insert invoice
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (invErr || !inv) {
      set({ loading: false });
      console.error('Create invoice error:', invErr);
      return null;
    }

    // Insert line items
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map((item, i) => ({
        ...item,
        invoice_id: inv.id,
        sort_order: i,
      }));

      const { error: itemErr } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemErr) {
        console.error('Insert items error:', itemErr);
      }
    }

    set({ loading: false });
    // Prepend to list
    set({ invoices: [inv as Invoice, ...get().invoices] });
    return inv as Invoice;
  },

  updateInvoiceStatus: async (id, status) => {
    const updates: any = { status };
    if (status === 'paid') {
      const inv = get().invoices.find((i) => i.id === id);
      if (inv) {
        updates.amount_paid = inv.grand_total;
        updates.balance_due = 0;
        updates.paid_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id);

    if (!error) {
      set({
        invoices: get().invoices.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      });
      return true;
    }
    return false;
  },

  deleteInvoice: async (id) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (!error) {
      set({ invoices: get().invoices.filter((i) => i.id !== id) });
      return true;
    }
    return false;
  },

  getNextNumber: async (businessId, prefix = 'INV') => {
    const { data, error } = await supabase
      .rpc('get_next_invoice_number', {
        p_business_id: businessId,
        p_prefix: prefix,
      });

    if (!error && data) return data as string;
    return prefix + '-0001';
  },
}));

// ========== GST CALCULATION HELPERS ==========

export function calculateLineItem(
  quantity: number,
  rate: number,
  discountPercent: number,
  gstRate: number,
  isInterstate: boolean
): Partial<InvoiceItem> {
  const lineTotal = quantity * rate;
  const discountAmount = (lineTotal * discountPercent) / 100;
  const taxableAmount = lineTotal - discountAmount;

  let cgst = 0, sgst = 0, igst = 0;

  if (gstRate > 0) {
    if (isInterstate) {
      igst = (taxableAmount * gstRate) / 100;
    } else {
      cgst = (taxableAmount * gstRate) / 200;
      sgst = (taxableAmount * gstRate) / 200;
    }
  }

  const total = taxableAmount + cgst + sgst + igst;

  return {
    discount_amount: Math.round(discountAmount * 100) / 100,
    taxable_amount: Math.round(taxableAmount * 100) / 100,
    cgst_amount: Math.round(cgst * 100) / 100,
    sgst_amount: Math.round(sgst * 100) / 100,
    igst_amount: Math.round(igst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function calculateInvoiceTotals(items: InvoiceItem[]) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const discount_amount = items.reduce((s, i) => s + i.discount_amount, 0);
  const taxable_amount = items.reduce((s, i) => s + i.taxable_amount, 0);
  const cgst_amount = items.reduce((s, i) => s + i.cgst_amount, 0);
  const sgst_amount = items.reduce((s, i) => s + i.sgst_amount, 0);
  const igst_amount = items.reduce((s, i) => s + i.igst_amount, 0);
  const total_tax = cgst_amount + sgst_amount + igst_amount;
  const grand_total = taxable_amount + total_tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discount_amount * 100) / 100,
    taxable_amount: Math.round(taxable_amount * 100) / 100,
    cgst_amount: Math.round(cgst_amount * 100) / 100,
    sgst_amount: Math.round(sgst_amount * 100) / 100,
    igst_amount: Math.round(igst_amount * 100) / 100,
    total_tax: Math.round(total_tax * 100) / 100,
    grand_total: Math.round(grand_total * 100) / 100,
  };
}

export const GST_RATES = [0, 5, 12, 18, 28];

export const UNITS = [
  'pcs', 'kg', 'gm', 'ltr', 'ml', 'mtr', 'ft',
  'box', 'dozen', 'pair', 'bundle', 'quintal', 'ton',
];
