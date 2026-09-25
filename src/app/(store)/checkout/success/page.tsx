import type { Metadata } from "next";
import Link from "next/link";
import { Check, Download, ArrowRight, Mail, Clock, BookOpen } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, digitalFiles } from "@/db/schema";
import { getCurrentUser, hashToken } from "@/lib/auth";
import { formatPrice } from "@/lib/store";
import ProductArt from "@/components/ProductArt";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";
import ClaimGuestOrder from "@/components/ClaimGuestOrder";
import CheckoutSteps from "@/components/CheckoutSteps";
import OrderStatusPoller from "@/components/OrderStatusPoller";

export const metadata: Metadata = { title: "Start Reading", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; key?: string; redirect_status?: string }> }) {
  const { order: id, key, redirect_status } = await searchParams;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return <main className="success-page"><h1>We couldn&apos;t find that order.</h1><Link className="button" href="/shop">Back to the shop <ArrowRight size={15} /></Link></main>;
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const user = await getCurrentUser();
  const ownsOrder = !!order && !!user && order.userId === user.id;
  const hasKey = !!order && !!key && key.length === 64 && hashToken(key) === order.accessTokenHash && order.accessExpiresAt > new Date();
  if (!order || (!ownsOrder && !hasKey)) return <main className="success-page"><h1>That link has expired.</h1><p>Please sign in to your account or get in touch and we&apos;ll help you find your purchase.</p><Link className="button" href="/account/login">Sign in <ArrowRight size={15} /></Link></main>;
  const query = key ? `?key=${encodeURIComponent(key)}` : "";
  if (order.paymentStatus !== "paid") {
    const failed = order.paymentStatus === "failed" || redirect_status === "failed";
    return <main className="success-page"><CheckoutSteps current={failed ? 2 : 3} /><div className="success-icon" style={{ marginTop: 34 }}><Clock size={31} /></div><span className="eyebrow">ORDER {order.orderNumber}</span><h1>{failed ? "Payment didn't go through." : "We're confirming your payment."}</h1><p>{failed ? "Nothing has been charged or unlocked. You can try again whenever you're ready." : "This usually takes just a moment. Your books will unlock automatically as soon as payment is verified."}</p>{!failed && <OrderStatusPoller />}<Link className="button" style={{ marginTop: 16 }} href={failed ? "/checkout" : `/checkout/success?order=${id}${key ? `&key=${key}` : ""}`}>{failed ? "Try again" : "Refresh status"} <ArrowRight size={15} /></Link></main>;
  }
  const items = await db.select({ item: orderItems, product: products, file: digitalFiles }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).leftJoin(digitalFiles, eq(orderItems.productId, digitalFiles.productId)).where(eq(orderItems.orderId, order.id));
  return <main className="success-page"><ClearCartOnSuccess orderId={order.id} /><CheckoutSteps current={3} freeOnly={order.total === 0} /><div className="success-icon" style={{ marginTop: 34 }}><Check size={32} strokeWidth={1.8} /></div><span className="eyebrow">ORDER {order.orderNumber}</span><h1>Start reading.</h1><p>{order.total === 0 ? "Your free files are ready — enjoy them right here, or download them to keep." : "Thank you! Your purchase is unlocked. Read online instantly, or download the PDF to keep on any device."}</p>{order.provider === "demo" && <div className="notice demo" style={{ marginTop: 23, textAlign: "left" }}>✳ This was a preview order. No real payment was collected.</div>}
    <div className="success-box"><h2 className="serif" style={{ fontSize: 32, color: "#29483f", fontWeight: 500, marginBottom: 13 }}>Your library</h2>{items.map(({ item, product, file }) => <div className="download-card" key={item.id}><div className="cart-item-art"><ProductArt product={{ name: item.productName, theme: product?.theme || "rose", coverImage: product?.coverImage, author: product?.author, type: product?.type }} /></div><div style={{ flex: 1 }}><div className="cart-item-name">{item.productName}</div><div className="cart-item-sub">{product?.author ? `by ${product.author} · ` : ""}{Math.max(0, (file ? (file.allowRedownload ? file.maxDownloads : 1) : 0) - item.downloads)} downloads left · unlimited online reading</div></div>{file && <div className="download-card-actions"><Link className="button button-small" href={`/read/${item.id}${query}`}><BookOpen size={13} /> Read now</Link><a className="button button-small button-outline" href={`/api/download/${item.id}${query}`}><Download size={13} /> PDF</a></div>}</div>)}
      {user && !order.userId && user.email.toLowerCase() === order.email.toLowerCase() && hasKey && <ClaimGuestOrder orderId={order.id} accessKey={key} />}
      {!user && <div className="notice" style={{ marginTop: 18 }}>♡ Want to keep this in a library you can return to? <Link href="/account/register" style={{ textDecoration: "underline", fontWeight: 700 }}>Create a free account</Link> with {order.email}, then connect this order with your receipt link.</div>}
      <div className="notice" style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}><Mail size={18} style={{ flex: "none" }} /><span>Order confirmation {process.env.RESEND_API_KEY ? `has been sent to ${order.email}.` : "will be emailed once email delivery is configured."} Bookmark this page — your secure link is valid until {new Date(order.accessExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 25, fontSize: 12, color: "#798579" }}><span>Total {order.total === 0 ? "" : "paid"}</span><strong style={{ color: "#29483f" }}>{order.total === 0 ? "Free" : formatPrice(order.total)}</strong></div>
      <div style={{ marginTop: 27, display: "flex", gap: 14, flexWrap: "wrap" }}><Link className="button button-outline" href="/ebooks">Browse more e-books <ArrowRight size={14} /></Link><Link className="text-link" href="/free">Free library <ArrowRight size={14} /></Link></div></div></main>;
}
