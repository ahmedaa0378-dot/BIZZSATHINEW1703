import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToastStore } from './toastStore';

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
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const notifications = data || [];
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      useToastStore.getState().addToast('Failed to load notifications', 'error');
      set({ loading: false });
    }
  },

  markAllRead: async (userId) => {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      if (error) throw error;
      set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      useToastStore.getState().addToast('Failed to update notifications', 'error');
    }
  },

  markRead: async (id) => {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) throw error;
      set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      useToastStore.getState().addToast('Failed to mark notification as read', 'error');
    }
  },

  addNotification: async (n) => {
    try {
      const { data, error } = await supabase.from('notifications').insert(n).select().single();
      if (error) throw error;
      if (data) {
        set(s => ({
          notifications: [data, ...s.notifications],
          unreadCount: s.unreadCount + 1,
        }));
      }
    } catch (err) {
      console.error('Failed to add notification:', err);
      useToastStore.getState().addToast('Failed to save notification', 'error');
    }
  },
}));