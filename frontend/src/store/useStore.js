import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      jwt: null,
      familyGroupId: null,

      // Family data
      family: null,
      products: [],
      syncing: false,
      lastSync: null,

      setAuth: (user, jwt, familyGroupId) => {
        localStorage.setItem('dispensa_jwt', jwt);
        set({ user, jwt, familyGroupId });
      },

      clearAuth: () => {
        localStorage.removeItem('dispensa_jwt');
        set({ user: null, jwt: null, familyGroupId: null, family: null, products: [] });
      },

      setFamily: (family) => set({ family }),
      setFamilyGroupId: (id) => set({ familyGroupId: id }),

      setProducts: (products) => set({ products }),

      upsertProduct: (product) =>
        set((s) => ({
          products: s.products.some((p) => p.id === product.id)
            ? s.products.map((p) => (p.id === product.id ? product : p))
            : [...s.products, product],
        })),

      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      setSyncing: (v) => set({ syncing: v }),
      setLastSync: () => set({ lastSync: new Date().toISOString() }),
    }),
    {
      name: 'dispensa-store',
      partialize: (s) => ({
        user: s.user,
        jwt: s.jwt,
        familyGroupId: s.familyGroupId,
        family: s.family,
        products: s.products,
      }),
    }
  )
);
