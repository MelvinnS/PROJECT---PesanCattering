import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  dailyMenuId: string;
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  remainingQuota: number;
  photoUrl?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (dailyMenuId: string) => void;
  updateQuantity: (dailyMenuId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (dailyMenuId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.dailyMenuId === item.dailyMenuId);
          if (existing) {
            if (existing.quantity >= item.remainingQuota) return state;
            return {
              items: state.items.map((i) =>
                i.dailyMenuId === item.dailyMenuId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },

      removeItem: (dailyMenuId) => {
        set((state) => ({
          items: state.items.filter((i) => i.dailyMenuId !== dailyMenuId),
        }));
      },

      updateQuantity: (dailyMenuId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((i) => i.dailyMenuId !== dailyMenuId),
            };
          }
          return {
            items: state.items.map((i) => {
              if (i.dailyMenuId === dailyMenuId) {
                const finalQty = Math.min(quantity, i.remainingQuota);
                return { ...i, quantity: finalQty };
              }
              return i;
            }),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemQuantity: (dailyMenuId) => {
        const item = get().items.find((i) => i.dailyMenuId === dailyMenuId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: "dk-catering-cart",
    }
  )
);
