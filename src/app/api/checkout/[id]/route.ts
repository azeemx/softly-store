import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { priceCart, UUID } from "@/lib/checkout";

export const runtime = "nodejs";

// Applies or removes a coupon on a pending embedded-card order and keeps the Stripe PaymentIntent amount in sync.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Order not found." }, { status: 404 });
  try {
    const body = await request.json();
    const key = String(body.key || "");
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order || key.length !== 64 || hashToken(key) !== order.accessTokenHash) return Response.json({ error: "Order not found." }, { status: 404 });
    if (order.paymentStatus !== "pending" || order.status !== "pending" || order.provider !== "stripe" || !order.providerSessionId?.startsWith("pi_")) return Response.json({ error: "This order can no longer be changed." }, { status: 409 });
    const items = await db.select({ productId: orderItems.productId }).from(orderItems).where(eq(orderItems.orderId, id));
    const pricing = await priceCart(items.map((item) => item.productId!).filter(Boolean), String(body.couponCode || ""));
    if ("error" in pricing) return Response.json({ error: pricing.error }, { status: 400 });
    if (pricing.total < 50) return Response.json({ error: "The total must be at least $0.50 for card payment. Remove the coupon or use a free item link instead." }, { status: 400 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.paymentIntents.update(order.providerSessionId, { amount: pricing.total });
    await db.update(orders).set({ subtotal: pricing.subtotal, discount: pricing.discount, tax: pricing.tax, total: pricing.total, couponCode: pricing.coupon?.code || null, updatedAt: new Date() }).where(and(eq(orders.id, id), eq(orders.paymentStatus, "pending")));
    return Response.json({ subtotal: pricing.subtotal, discount: pricing.discount, tax: pricing.tax, total: pricing.total, code: pricing.coupon?.code || "" });
  } catch (error) { console.error("Checkout update error", error); return Response.json({ error: "Could not update the order. Please try again." }, { status: 500 }); }
}
