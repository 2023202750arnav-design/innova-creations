import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "./data";

type Line = { product: Product; qty: number; variant?: string };
type Store = {
  cart: Line[];
  wishlist: string[];
  addCart: (product: Product, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  clearCart: () => void;
};

export const useShop = create<Store>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addCart: (product, qty = 1) => set((s) => {
        const existing = s.cart.find((line) => line.product.id === product.id);
        return existing
          ? { cart: s.cart.map((line) => line.product.id === product.id ? { ...line, qty: line.qty + qty } : line) }
          : { cart: [...s.cart, { product, qty }] };
      }),
      updateQty: (id, qty) => set((s) => ({ cart: s.cart.map((line) => line.product.id === id ? { ...line, qty: Math.max(1, qty) } : line) })),
      removeCart: (id) => set((s) => ({ cart: s.cart.filter((line) => line.product.id !== id) })),
      toggleWishlist: (id) => set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id] })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: "innova-shop" },
  ),
);
