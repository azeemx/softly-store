"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

export default function ClearCartOnSuccess({ orderId }: { orderId: string }) {
  const { removeItem, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    try {
      const raw = sessionStorage.getItem("softly_pending_order");
      if (!raw) return;
      const pending = JSON.parse(raw) as { orderId?: string; productIds?: string[] };
      if (pending.orderId !== orderId) return;
      sessionStorage.removeItem("softly_pending_order");
      if (Array.isArray(pending.productIds)) pending.productIds.forEach((id) => removeItem(id));
    } catch { sessionStorage.removeItem("softly_pending_order"); }
  }, [orderId, ready, removeItem]);
  return null;
}
