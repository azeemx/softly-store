import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Download, ArrowRight, ShoppingBag, BookOpen } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/store";
import ProductArt from "@/components/ProductArt";
import LogoutButton from "@/components/LogoutButton";
import ClaimGuestOrder from "@/components/ClaimGuestOrder";

export const metadata: Metadata = { title: "My Account & Downloads", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const user = await getCurrentUser(); if (!user) redirect("/account/login");
  const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  const withItems = await Promise.all(userOrders.map(async (order) => ({ order, items: await db.select({ item: orderItems, product: products }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, order.id)) })));
  return <main><div className="container" style={{ maxWidth: 990, paddingTop: 70, paddingBottom: 100 }}><div className="account-heading"><div><span className="eyebrow">YOUR LITTLE CORNER</span><h1 className="serif" style={{ fontSize: 55, color: "#29483f", fontWeight: 500, marginTop: 12 }}>Hello, {user.name.split(" ")[0]}.</h1><p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>Your journals and past orders live here, all in one place.</p></div><LogoutButton /></div><div id="orders"><h2 className="serif" style={{ fontSize: 33, color: "#29483f", fontWeight: 500, margin: "0 0 15px" }}>My orders & downloads</h2>{withItems.length ? withItems.map(({ order, items }) => <div className="order-card" key={order.id}><div className="order-card-head"><div><strong>{order.orderNumber}</strong><span className="muted" style={{ marginLeft: 13 }}>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div><div style={{ display: "flex", gap: 13, alignItems: "center" }}><span className={`status-badge ${order.paymentStatus === "paid" ? "" : order.paymentStatus}`}>{order.paymentStatus === "paid" ? "Ready to download" : order.paymentStatus}</span><strong>{formatPrice(order.total)}</strong></div></div><div id="downloads">{items.map(({ item, product }) => <div className="cart-item" key={item.id} style={{ borderBottom: 0 }}><div className="cart-item-art" style={{ width: 62, height: 68 }}><ProductArt product={{ name: item.productName, theme: product?.theme || "rose", coverImage: product?.coverImage, type: product?.type, author: product?.author }} /></div><div style={{ flex: 1 }}><h3 className="cart-item-name" style={{ fontSize: 20 }}>{item.productName}</h3><div className="cart-item-sub">{item.downloads} downloads used · Digital PDF</div></div>{order.paymentStatus === "paid" && <div className="download-card-actions"><Link className="button button-small" href={`/read/${item.id}`}><BookOpen size={13} /> Read</Link><a className="button button-small button-outline" href={`/api/download/${item.id}`}><Download size={13} /> PDF</a></div>}</div>)}</div></div>) : <div className="empty-state"><ShoppingBag size={30} style={{ color: "#bca392" }} /><h2>No orders yet, and that&apos;s okay.</h2><p className="muted" style={{ fontSize: 12 }}>Your next journaling moment is just around the corner.</p><Link href="/shop" className="button" style={{ marginTop: 18 }}>Explore journals <ArrowRight size={15} /></Link></div>}</div><ClaimGuestOrder /></div></main>;
}
