import { create } from "zustand";

export interface CartItem {
  key: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];

  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const exists = state.items.find((i) => i.key === item.key);

      if (exists) {
        return {
          items: state.items.map((i) =>
            i.key === item.key ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }

      return { items: [...state.items, item] };
    }),

  removeItem: (key) =>
    set((state) => ({
      items: state.items.filter((i) => i.key !== key),
    })),

  clear: () => set({ items: [] }),
}));
