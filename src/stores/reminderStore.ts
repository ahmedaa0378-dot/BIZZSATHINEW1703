import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToastStore } from './toastStore';

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
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      set({ reminders: data || [], loading: false });
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      useToastStore.getState().addToast('Failed to load reminders', 'error');
      set({ loading: false });
    }
  },

  addReminder: async (r) => {
    try {
      const { data, error } = await supabase.from('reminders').insert(r).select().single();
      if (error) throw error;
      if (data) set(s => ({ reminders: [...s.reminders, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) }));
    } catch (err) {
      console.error('Failed to add reminder:', err);
      useToastStore.getState().addToast('Failed to add reminder', 'error');
    }
  },

  toggleComplete: async (id, completed) => {
    try {
      const { error } = await supabase.from('reminders').update({ completed }).eq('id', id);
      if (error) throw error;
      set(s => ({ reminders: s.reminders.map(r => r.id === id ? { ...r, completed } : r) }));
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      useToastStore.getState().addToast('Failed to update reminder', 'error');
    }
  },

  deleteReminder: async (id) => {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      useToastStore.getState().addToast('Failed to delete reminder', 'error');
    }
  },
}));