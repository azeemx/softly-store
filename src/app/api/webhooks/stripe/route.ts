import Stripe from "stripe";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { fulfillOrder, markOrderFailed } from "@/lib/payments";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return Response.json({ error: "Webhook not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (error) { console.error("Invalid Stripe signature", error); return Response.json({ error: "Invalid signature" }, { status: 400 }); }
  try {
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (session.payment_status === "paid" && orderId) {
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order || order.provider !== "stripe" || order.total !== session.amount_total || session.currency !== "usd") return Response.json({ error: "Order validation failed" }, { status: 400 });
        if (!order.providerSessionId) await db.update(orders).set({ providerSessionId: session.id }).where(and(eq(orders.id, orderId), isNull(orders.providerSessionId)));
        const [verified] = await db.select({ providerSessionId: orders.providerSessionId }).from(orders).where(eq(orders.id, orderId)).limit(1);
        if (verified?.providerSessionId !== session.id) return Response.json({ error: "Checkout session mismatch" }, { status: 400 });
        await fulfillOrder(orderId, "stripe", String(session.payment_intent || session.id));
      }
    }
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        // Hosted Checkout sessions are fulfilled via checkout.session events; only embedded PaymentIntents are handled here.
        if (order && order.provider === "stripe" && order.providerSessionId === intent.id) {
          if (order.total !== intent.amount_received || intent.currency !== "usd") return Response.json({ error: "Amount mismatch" }, { status: 400 });
          await fulfillOrder(orderId, "stripe", intent.id);
        }
      }
    }
    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      // Leave the order pending so the customer can retry within the same PaymentIntent; it expires naturally.
      console.warn("Payment attempt failed for order", intent.metadata?.orderId);
    }
    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.orderId) await markOrderFailed(session.metadata.orderId);
    }
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const transactionId = String(charge.payment_intent || "");
      if (transactionId) {
        await db.update(orders).set({ paymentStatus: "refunded", status: "cancelled", updatedAt: new Date() }).where(eq(orders.transactionId, transactionId));
        await db.update(payments).set({ status: "refunded" }).where(eq(payments.transactionId, transactionId));
      }
    }
    return Response.json({ received: true });
  } catch (error) { console.error("Stripe webhook processing error", error); return Response.json({ error: "Processing error" }, { status: 500 }); }
}
