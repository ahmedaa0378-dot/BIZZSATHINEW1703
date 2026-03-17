import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Contact {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: 'customer' | 'supplier' | 'both';
  business_name: string | null;
  gstin: string | null;
  address: string | null;
  credit_limit: number;
  opening_balance: number;
  outstanding_balance: number;
  tags: string[];
  notes: string | null;
  total_business: number;
  last_transaction_at: string | null;
  created_at: string;
}

interface ContactStore {
  contacts: Contact[];
  loading: boolean;
  fetchContacts: (businessId: string) => Promise<void>;
  addContact: (contact: Partial<Contact> & { business_id: string; name: string; type: string }) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
  getContact: (id: string) => Contact | undefined;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  loading: false,

  fetchContacts: async (businessId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('business_id', businessId)
      .order('name');

    set({ loading: false });
    if (!error && data) {
      set({ contacts: data as Contact[] });
    }
  },

  addContact: async (contact) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();

    set({ loading: false });
    if (error) {
      console.error('Add contact error:', error);
      return null;
    }
    set({ contacts: [...get().contacts, data as Contact].sort((a, b) => a.name.localeCompare(b.name)) });
    return data as Contact;
  },

  updateContact: async (id, updates) => {
    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id);

    if (!error) {
      set({
        contacts: get().contacts.map((c) =>
          c.id === id ? { ...c, ...updates } as Contact : c
        ),
      });
      return true;
    }
    return false;
  },

  deleteContact: async (id) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (!error) {
      set({ contacts: get().contacts.filter((c) => c.id !== id) });
      return true;
    }
    return false;
  },

  getContact: (id) => get().contacts.find((c) => c.id === id),
}));
