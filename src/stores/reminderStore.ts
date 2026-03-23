import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  type: 'payment' | 'stock' | 'follow_up' | 'general';
  completed: boolean;
  created_at: string;
}

interface ReminderStore {
  reminders: Reminder[];
  loading: boolean;
  fetchReminders: (userId: string) => Promise<void>;
  addReminder: (r: Omit<Reminder, 'id' | 'created_at'> & { user_id: string; business_id: string }) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  loading: false,

  fetchReminders: async (userId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    set({ reminders: data || [], loading: false });
  },

  addReminder: async (r) => {
    const { data } = await supabase.from('reminders').insert(r).select().single();
    if (data) set(s => ({ reminders: [...s.reminders, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) }));
  },

  toggleComplete: async (id, completed) => {
    await supabase.from('reminders').update({ completed }).eq('id', id);
    set(s => ({ reminders: s.reminders.map(r => r.id === id ? { ...r, completed } : r) }));
  },

  deleteReminder: async (id) => {
    await supabase.from('reminders').delete().eq('id', id);
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
  },
}));