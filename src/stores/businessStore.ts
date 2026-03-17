import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Business {
  id: string;
  name: string;
  type?: string;
  gstNumber?: string;
  address?: string;
  phone?: string;
}

interface BusinessStore {
  business: Business | null;
  setBusiness: (business: Business | null) => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      business: null,
      setBusiness: (business) => set({ business }),
    }),
    {
      name: 'bizsaathi-business',
    }
  )
);
