import { create } from 'zustand';

interface AuthStore {
  user: null | { id: string; email: string };
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setUser: (user: AuthStore['user']) => void;
  setOnboarded: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnboarded: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOnboarded: (v) => set({ isOnboarded: v }),
  logout: () => set({ user: null, isAuthenticated: false, isOnboarded: false }),
}));

interface BusinessStore {
  business: null | {
    id: string;
    name: string;
    type: string;
    category: string;
    ownerName: string;
  };
  setBusiness: (b: BusinessStore['business']) => void;
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  business: null,
  setBusiness: (business) => set({ business }),
}));
