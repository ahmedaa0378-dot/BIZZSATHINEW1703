import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (userId: string, businessId: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'created_at'> & { user_id: string; business_id: string }) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId, businessId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    const notifications = data || [];
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      loading: false,
    });
  },

  markAllRead: async (userId) => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  markRead: async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  addNotification: async (n) => {
    const { data } = await supabase.from('notifications').insert(n).select().single();
    if (data) {
      set(s => ({
        notifications: [data, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      }));
    }
  },
}));