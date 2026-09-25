"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "@/components/CartProvider";

export default function AddToCartButton({ item, variant = "full", buyNow = false }: { item: CartItem; variant?: "full" | "outline" | "icon"; buyNow?: boolean }) {
  const { addItem, hasItem } = useCart();
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const alreadyAdded = hasItem(item.id);
  const handleClick = () => { addItem(item); setAdded(true); if (buyNow) router.push("/checkout"); else setTimeout(() => setAdded(false), 2300); };
  if (variant === "icon") return <button className="product-quick-add" onClick={handleClick} aria-label={alreadyAdded ? `${item.name} is in your bag` : `Add ${item.name} to bag`} title={alreadyAdded ? "In your bag" : "Add to bag"}>{alreadyAdded || added ? <Check size={17} /> : <Plus size={18} />}</button>;
  return <button className={`button ${variant === "outline" ? "button-outline" : ""}`} onClick={handleClick}>{buyNow ? "Buy it now" : added || alreadyAdded ? "Added to bag" : "Add to bag"}{added || (alreadyAdded && !buyNow) ? <Check size={15} /> : <ShoppingBag size={15} />}</button>;
}
