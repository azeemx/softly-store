"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type CartItem = { id: string; slug: string; name: string; subtitle: string; price: number; originalPrice: number; theme: string; coverImage: string | null; type?: string; author?: string };
type CartContextType = { items: CartItem[]; count: number; total: number; ready: boolean; addItem: (item: CartItem) => void; removeItem: (id: string) => void; clearCart: () => void; refreshCart: () => Promise<void>; hasItem: (id: string) => boolean };
const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const synchronize = useCallback(async (snapshot: CartItem[]) => {
    if (!snapshot.length) return;
    try {
      const response = await fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: snapshot.map((item) => item.id) }) });
      if (!response.ok) return;
      const result = await response.json();
      if (!Array.isArray(result.items)) return;
      const requested = new Set(snapshot.map((item) => item.id));
      const live = new Map<string, CartItem>(result.items.map((item: CartItem) => [item.id, item]));
      setItems((current) => {
        const updated = current.filter((item) => !requested.has(item.id) || live.has(item.id)).map((item) => live.get(item.id) || item);
        return JSON.stringify(current) === JSON.stringify(updated) ? current : updated;
      });
    } catch { /* Checkout still validates availability and price on the server. */ }
  }, []);

  useEffect(() => {
    let saved: CartItem[] = [];
    try { const stored = JSON.parse(localStorage.getItem("softly_cart") || "[]"); if (Array.isArray(stored)) saved = stored.filter((item) => item && typeof item.id === "string").slice(0, 30); } catch { /* Ignore invalid local data. */ }
    itemsRef.current = saved;
    setItems(saved);
    setReady(true);
    void synchronize(saved);
  }, [synchronize]);
  useEffect(() => { if (ready) localStorage.setItem("softly_cart", JSON.stringify(items)); }, [items, ready]);

  const addItem = (item: CartItem) => setItems((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
  const removeItem = (id: string) => setItems((current) => current.filter((entry) => entry.id !== id));
  const clearCart = () => setItems([]);
  const refreshCart = useCallback(async () => { await synchronize(itemsRef.current); }, [synchronize]);
  return <CartContext.Provider value={{ items, count: items.length, total: items.reduce((sum, item) => sum + item.price, 0), ready, addItem, removeItem, clearCart, refreshCart, hasItem: (id) => items.some((item) => item.id === id) }}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("CartProvider missing"); return context; }
