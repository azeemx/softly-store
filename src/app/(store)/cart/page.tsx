"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, LockKeyhole, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import ProductArt from "@/components/ProductArt";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, total, removeItem, ready, refreshCart } = useCart();
  useEffect(() => { if (ready) void refreshCart(); }, [ready, refreshCart]);
  return <main><div className="container cart-layout"><div><span className="eyebrow">YOUR LITTLE COLLECTION</span><h1 className="cart-title">Your bag<span style={{ color: "#d09d8b" }}>.</span></h1>{!ready ? <p className="muted">Loading your bag...</p> : items.length ? <><div>{items.map((item) => <div className="cart-item" key={item.id}><Link href={`/products/${item.slug}`} className="cart-item-art"><ProductArt product={item} /></Link><div><h2 className="cart-item-name"><Link href={`/products/${item.slug}`}>{item.name}</Link></h2><div className="cart-item-sub">Digital PDF journal · Instant download</div><button className="remove-button" onClick={() => removeItem(item.id)}>Remove</button></div><span className="cart-item-price">{formatPrice(item.price)}</span></div>)}</div><Link href="/shop" className="text-link" style={{ marginTop: 26 }}>Keep exploring <ArrowRight size={15} /></Link></> : <div className="empty-state"><ShoppingBag size={30} style={{ color: "#b8a392" }} /><h2>Your bag is taking a little breather.</h2><p className="muted" style={{ fontSize: 12 }}>There&apos;s a journal waiting to meet you.</p><Link href="/shop" className="button" style={{ marginTop: 20 }}>Explore journals <ArrowRight size={15} /></Link></div>}</div>
    {items.length > 0 && <aside className="summary-card"><h2>Order summary</h2><div className="summary-line"><span>{items.length} {items.length === 1 ? "journal" : "journals"}</span><strong>{formatPrice(total)}</strong></div><div className="summary-line"><span>Delivery</span><strong>Instant & free</strong></div><div className="summary-line summary-total"><span>Subtotal</span><span>{formatPrice(total)}</span></div><Link className="button" href="/checkout">Continue to checkout <ArrowRight size={15} /></Link><div className="summary-note"><LockKeyhole size={13} /> Secure checkout · Instant download</div><div className="notice" style={{ marginTop: 25 }}>✳ &nbsp; Your journals are digital PDFs. Nothing to ship, everything to explore.</div></aside>}
  </div></main>;
}
