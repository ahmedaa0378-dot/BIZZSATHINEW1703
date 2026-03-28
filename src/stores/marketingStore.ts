import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useToastStore } from './toastStore';
import { proxyChat } from '../lib/api-proxy';

export interface MarketingPost {
  id: string;
  business_id: string;
  post_type: string;
  title: string;
  caption: string | null;
  language: string;
  tone: string;
  format: string;
  image_url: string | null;
  platform: string[];
  scheduled_at: string | null;
  published_at: string | null;
  status: string;
  created_at: string;
}

export interface Festival {
  id: string;
  name: string;
  date: string;
  region: string;
  description: string | null;
}

interface MarketingStore {
  posts: MarketingPost[];
  festivals: Festival[];
  upcomingFestivals: Festival[];
  loading: boolean;
  fetchPosts: (businessId: string) => Promise<void>;
  fetchFestivals: () => Promise<void>;
  createPost: (post: Partial<MarketingPost>) => Promise<MarketingPost | null>;
  deletePost: (id: string) => Promise<boolean>;
}

export const useMarketingStore = create<MarketingStore>((set, get) => ({
  posts: [],
  festivals: [],
  upcomingFestivals: [],
  loading: false,

  fetchPosts: async (businessId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ loading: false });
      if (data) set({ posts: data as MarketingPost[] });
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      useToastStore.getState().addToast('Failed to load campaigns', 'error');
      set({ loading: false });
    }
  },

  fetchFestivals: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('festivals')
        .select('*')
        .gte('date', today)
        .order('date')
        .limit(20);
      if (error) throw error;
      if (data) {
        set({ festivals: data as Festival[] });
        const fifteenDays = new Date();
        fifteenDays.setDate(fifteenDays.getDate() + 15);
        const upcoming = (data as Festival[]).filter((f) => new Date(f.date) <= fifteenDays);
        set({ upcomingFestivals: upcoming });
      }
    } catch (err) {
      console.error('Failed to fetch festivals:', err);
      useToastStore.getState().addToast('Failed to load festivals', 'error');
    }
  },

  createPost: async (post) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      set({ loading: false });
      if (data) {
        set({ posts: [data as MarketingPost, ...get().posts] });
        return data as MarketingPost;
      }
      return null;
    } catch (err) {
      console.error('Failed to create post:', err);
      useToastStore.getState().addToast('Failed to save post', 'error');
      set({ loading: false });
      return null;
    }
  },

  deletePost: async (id) => {
    try {
      const { error } = await supabase
        .from('marketing_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      set({ posts: get().posts.filter((p) => p.id !== id) });
      return true;
    } catch (err) {
      console.error('Failed to delete post:', err);
      useToastStore.getState().addToast('Failed to delete post', 'error');
      return false;
    }
  },
}));

export const POST_TYPES = [
  { value: 'product_promo', label: 'Product Promo', emoji: '🛍️' },
  { value: 'discount', label: 'Discount/Sale', emoji: '🏷️' },
  { value: 'festival', label: 'Festival', emoji: '🎉' },
  { value: 'new_arrival', label: 'New Arrival', emoji: '✨' },
  { value: 'business_promo', label: 'Business Promo', emoji: '📢' },
  { value: 'testimonial', label: 'Testimonial', emoji: '⭐' },
  { value: 'announcement', label: 'Announcement', emoji: '📣' },
  { value: 'custom', label: 'Custom', emoji: '🎨' },
];

export const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent/FOMO' },
  { value: 'festive', label: 'Festive' },
];

// AI Caption Generator — uses proxy
export async function generateCaption(
  postType: string,
  productName: string,
  details: string,
  tone: string,
  language: string,
  businessName: string
): Promise<string> {
  try {
    const data = await proxyChat([
      {
        role: 'system',
        content: `You are a social media caption writer for Indian small businesses.
Business: ${businessName}
Write a ${tone} social media caption for a ${postType.replace('_', ' ')} post.
Language: ${language === 'hi' ? 'Hindi/Hinglish' : language === 'en' ? 'English' : 'Mix'}
Include emojis and 3-5 relevant hashtags.
Keep it under 200 words. Make it engaging and shareable.
DO NOT use markdown formatting. Just plain text.`
      },
      {
        role: 'user',
        content: `Product/Offer: ${productName}\nDetails: ${details}`
      }
    ], { temperature: 0.8, max_tokens: 300 });

    return data.choices?.[0]?.message?.content || 'Could not generate caption.';
  } catch {
    return 'Error generating caption. Please try again.';
  }
}