import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "./data";

type Line = { product: Product; qty: number; variant?: string };
type Store = {
  cart: Line[];
  wishlist: string[];
  addCart: (product: Product, qty?: number, variant?: string) => void;
  updateQty: (id: string, qty: number, variant?: string) => void;
  removeCart: (id: string, variant?: string) => void;
  toggleWishlist: (id: string) => void;
  clearCart: () => void;
};

export const useShop = create<Store>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addCart: (product, qty = 1, variant) => set((s) => {
        const existing = s.cart.find((line) => line.product.id === product.id && line.variant === variant);
        return existing
          ? { cart: s.cart.map((line) => line.product.id === product.id && line.variant === variant ? { ...line, qty: line.qty + qty } : line) }
          : { cart: [...s.cart, { product, qty, variant }] };
      }),
      updateQty: (id, qty, variant) => set((s) => ({
        cart: s.cart.map((line) => line.product.id === id && line.variant === variant ? { ...line, qty: Math.max(1, qty) } : line)
      })),
      removeCart: (id, variant) => set((s) => ({
        cart: s.cart.filter((line) => !(line.product.id === id && line.variant === variant))
      })),
      toggleWishlist: (id) => set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id] })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: "innova-shop" },
  ),
);
