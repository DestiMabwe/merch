"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cartCount, cartSubtotal, loadCart, saveCart, type CartItem } from "./cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Must start empty (matching SSR, which has no localStorage) and load after mount —
  // reading localStorage in the initial state would render a different tree on the
  // client than the server sent, which trips a hydration mismatch and makes React
  // discard the whole subtree (losing in-progress form input) right as it happens.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Loading persisted cart state after mount, not derivable during render (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  function addItem(item: Omit<CartItem, "quantity">, quantity: number) {
    setItems((current) => {
      const existing = current.find((i) => i.variantId === item.variantId);
      const cap = item.stock;
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, cap);
        return current.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: nextQuantity, stock: cap } : i,
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, cap) }];
    });
  }

  function setQuantity(variantId: number, quantity: number) {
    setItems((current) =>
      current
        .map((i) =>
          i.variantId === variantId ? { ...i, quantity: Math.min(Math.max(quantity, 0), i.stock) } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function removeItem(variantId: number) {
    setItems((current) => current.filter((i) => i.variantId !== variantId));
  }

  function clear() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count: cartCount(items),
        subtotal: cartSubtotal(items),
        addItem,
        setQuantity,
        removeItem,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
