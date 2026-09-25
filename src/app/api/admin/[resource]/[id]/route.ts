import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { categories, contactMessages, coupons, digitalFiles, faqs, orderItems, orders, products, testimonials, users, payments } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { adminError, audit, parseCategory, parseCoupon, parseProduct } from "@/lib/admin";
import { emailLayout, sendEmail } from "@/lib/email";
import { invalidatePreview } from "@/lib/storage";

export const runtime = "nodejs";
type Context = { params: Promise<{ resource: string; id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403);
  const { resource, id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return adminError("Invalid ID");
  try {
    const body = await request.json(); let item: unknown;
    if (resource === "products") {
      const input = parseProduct(body);
      if (input.status === "published") { const [file] = await db.select({ id: digitalFiles.id }).from(digitalFiles).where(eq(digitalFiles.productId, id)).limit(1); if (!file) return adminError("Upload a private PDF before publishing this journal."); }
      [item] = await db.update(products).set(input).where(eq(products.id, id)).returning();
      if (item && (body.maxDownloads !== undefined || body.expiryDays !== undefined || body.allowRedownload !== undefined || body.previewPages !== undefined)) {
        const [file] = await db.select({ storageKey: digitalFiles.storageKey }).from(digitalFiles).where(eq(digitalFiles.productId, id)).limit(1);
        await db.update(digitalFiles).set({ maxDownloads: Math.max(1, Math.min(100, Math.round(Number(body.maxDownloads) || 5))), expiryDays: Math.max(1, Math.min(365, Math.round(Number(body.expiryDays) || 30))), allowRedownload: body.allowRedownload !== false, previewPages: Math.max(0, Math.min(50, Math.round(Number(body.previewPages ?? 3)))) }).where(eq(digitalFiles.productId, id));
        if (file) invalidatePreview(file.storageKey);
      }
    } else if (resource === "categories") [item] = await db.update(categories).set(parseCategory(body)).where(eq(categories.id, id)).returning();
    else if (resource === "coupons") [item] = await db.update(coupons).set(parseCoupon(body)).where(eq(coupons.id, id)).returning();
    else if (resource === "faqs") [item] = await db.update(faqs).set({ question: String(body.question || "").trim().slice(0, 350), answer: String(body.answer || "").trim().slice(0, 3000), sortOrder: Math.round(Number(body.sortOrder) || 0), active: body.active !== false }).where(eq(faqs.id, id)).returning();
    else if (resource === "testimonials") [item] = await db.update(testimonials).set({ quote: String(body.quote || "").trim().slice(0, 1200), name: String(body.name || "").trim().slice(0, 100), detail: String(body.detail || "").trim().slice(0, 150), active: body.active !== false }).where(eq(testimonials.id, id)).returning();
    else if (resource === "customers") { if (!['active', 'disabled'].includes(String(body.status))) return adminError("Invalid status"); const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1); if (!target || target.role === "admin") return adminError("This account can't be changed.", 403); [item] = await db.update(users).set({ status: body.status, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, status: users.status }); }
    else if (resource === "messages") [item] = await db.update(contactMessages).set({ status: body.status === "read" ? "read" : "unread" }).where(eq(contactMessages.id, id)).returning();
    else if (resource === "orders") {
      const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1); if (!order) return adminError("Order not found", 404);
      if (body.action === "refund") {
        if (order.paymentStatus !== "paid") return adminError("Only paid orders can be refunded.");
        if (order.provider === "stripe") { if (!process.env.STRIPE_SECRET_KEY || !order.transactionId) return adminError("Stripe isn't configured for refunds."); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); await stripe.refunds.create({ payment_intent: order.transactionId }); }
        [item] = await db.update(orders).set({ paymentStatus: "refunded", status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, id)).returning();
        await db.update(payments).set({ status: "refunded" }).where(eq(payments.orderId, id));
        if (process.env.RESEND_API_KEY) await sendEmail(order.email, `Refund update — ${order.orderNumber}`, emailLayout("Your refund update", `<p>Your order ${order.orderNumber} has been refunded. If you have any questions, please reply to this email.</p>`));
      } else if (body.action === "cancel" && order.paymentStatus === "pending" && order.status === "pending") {
        if (order.provider === "stripe") {
          if (!process.env.STRIPE_SECRET_KEY || !order.providerSessionId) return adminError("Checkout is still being prepared. Please try again shortly.", 409);
          await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.expire(order.providerSessionId);
        }
        [item] = await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(orders.id, id), eq(orders.paymentStatus, "pending"), eq(orders.status, "pending"))).returning();
      } else return adminError("This order action isn't available.");
    } else return adminError("Unknown resource", 404);
    if (!item) return adminError("Not found", 404);
    await audit(admin.id, "update", resource, id, resource === "orders" ? { action: body.action } : undefined);
    return Response.json({ success: true, item });
  } catch (error) { console.error("Admin update error", error); return adminError(error instanceof Error && !error.message.includes("duplicate key") ? error.message : "A record with that name or code already exists.", 400); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403);
  const { resource, id } = await context.params; if (!/^[0-9a-f-]{36}$/i.test(id)) return adminError("Invalid ID");
  try {
    if (resource === "products") { const [sold] = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, id)).limit(1); if (sold) await db.update(products).set({ status: "draft" }).where(eq(products.id, id)); else await db.delete(products).where(eq(products.id, id)); }
    else if (resource === "categories") await db.delete(categories).where(eq(categories.id, id));
    else if (resource === "coupons") { const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1); if (coupon?.usedCount) await db.update(coupons).set({ active: false }).where(eq(coupons.id, id)); else await db.delete(coupons).where(eq(coupons.id, id)); }
    else if (resource === "faqs") await db.delete(faqs).where(eq(faqs.id, id));
    else if (resource === "testimonials") await db.delete(testimonials).where(eq(testimonials.id, id));
    else return adminError("Unknown resource", 404);
    await audit(admin.id, "delete", resource, id);
    return Response.json({ success: true });
  } catch (error) { console.error("Admin delete error", error); return adminError("Could not remove this record.", 400); }
}
