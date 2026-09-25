import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { newsletterSubscribers, orderItems, orders } from "@/db/schema";
import { accessKeyForOrder, clientIp, getCurrentUser, hashToken, isDemoMode, rateLimit } from "@/lib/auth";
import { fulfillOrder } from "@/lib/payments";
import { EMAIL, parseProductIds, priceCart } from "@/lib/checkout";

export const runtime = "nodejs";

function stripeReady() { return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET; }
function embeddedReady() { return stripeReady() && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; }

export async function GET() {
  return Response.json({ demo: isDemoMode(), card: embeddedReady(), hosted: stripeReady(), publishableKey: embeddedReady() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : null });
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`checkout:${clientIp(request)}`, 30, 60 * 60 * 1000)) return Response.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 });
  try {
    const body = await request.json();
    const ids = parseProductIds(body.productIds);
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim().slice(0, 100);
    const country = String(body.country || "").trim().slice(0, 60);
    const method = ["card", "hosted", "preview", "free"].includes(body.method) ? String(body.method) : "preview";
    if (!ids.length || !EMAIL.test(email) || name.length < 2) return Response.json({ error: "Please add an item and enter your name and email." }, { status: 400 });
    const pricing = await priceCart(ids, String(body.couponCode || ""));
    if ("error" in pricing) return Response.json({ error: pricing.error }, { status: 400 });
    const { total } = pricing;
    if (body.subscribe) await db.insert(newsletterSubscribers).values({ email }).onConflictDoNothing();
    const user = await getCurrentUser();
    const id = randomUUID();
    const accessKey = accessKeyForOrder(id);
    const successPath = `/checkout/success?order=${id}&key=${accessKey}`;
    const orderNumber = `SF-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const provider = total === 0 ? "free" : isDemoMode() ? "demo" : "stripe";
    if (total > 0 && !isDemoMode()) {
      if (!stripeReady()) return Response.json({ error: "Secure payment isn't configured yet. Please contact support." }, { status: 503 });
      if (total < 50) return Response.json({ error: "The total must be at least $0.50 for card payment." }, { status: 400 });
      if (method === "card" && !embeddedReady()) return Response.json({ error: "Card payment is unavailable right now. Please choose another payment method." }, { status: 400 });
    }
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({ id, orderNumber, userId: user?.email === email ? user.id : null, email, customerName: country ? `${name} (${country})` : name, subtotal: pricing.subtotal, discount: pricing.discount, tax: pricing.tax, total, couponCode: pricing.coupon?.code, provider, accessTokenHash: hashToken(accessKey), accessExpiresAt: new Date(Date.now() + pricing.expiryDays * 86400000) });
      await tx.insert(orderItems).values(pricing.lines.map((line) => ({ orderId: id, productId: line.product.id, productName: line.product.name, unitPrice: line.unitPrice })));
    });
    if (total === 0 || isDemoMode()) {
      await fulfillOrder(id, provider, `${provider}_${randomUUID()}`);
      return Response.json({ url: successPath, demo: isDemoMode() && total > 0, orderId: id });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const base = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    if (method === "card") {
      const intent = await stripe.paymentIntents.create({ amount: total, currency: "usd", automatic_payment_methods: { enabled: true }, receipt_email: email, description: `Softly order ${orderNumber}`, metadata: { orderId: id } }, { idempotencyKey: `pi_${id}` });
      await db.update(orders).set({ providerSessionId: intent.id }).where(eq(orders.id, id));
      return Response.json({ clientSecret: intent.client_secret, orderId: id, successUrl: `${base}${successPath}`, total });
    }
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pricing.discount > 0 || pricing.tax > 0 ? [{ price_data: { currency: "usd", product_data: { name: `Softly order ${orderNumber} (${pricing.lines.length} ${pricing.lines.length === 1 ? "item" : "items"})` }, unit_amount: total }, quantity: 1 }] : pricing.lines.map((line) => ({ price_data: { currency: "usd", product_data: { name: line.product.name, description: line.product.subtitle.slice(0, 500) || undefined }, unit_amount: line.unitPrice }, quantity: 1 }));
    const session = await stripe.checkout.sessions.create({ mode: "payment", customer_email: email, client_reference_id: id, metadata: { orderId: id }, payment_intent_data: { metadata: { orderId: id } }, line_items: lineItems, success_url: `${base}${successPath}`, cancel_url: `${base}/checkout/failed?order=${id}` }, { idempotencyKey: `cs_${id}` });
    await db.update(orders).set({ providerSessionId: session.id }).where(eq(orders.id, id));
    return Response.json({ url: session.url, orderId: id });
  } catch (err) { console.error("Checkout error", err); return Response.json({ error: "We couldn't start checkout. Please try again." }, { status: 500 }); }
}
