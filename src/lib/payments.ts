import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { coupons, couponUsages, orders, payments } from "@/db/schema";
import { accessKeyForOrder } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";

export async function getCouponDiscount(code: string, subtotal: number) {
  if (!code.trim()) return { discount: 0, coupon: null, error: "" };
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.trim().toUpperCase())).limit(1);
  if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date()) || (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)) return { discount: 0, coupon: null, error: "This code isn't valid or has expired." };
  if (subtotal < coupon.minSpend) return { discount: 0, coupon: null, error: `This code needs a minimum order of $${(coupon.minSpend / 100).toFixed(2)}.` };
  const discount = Math.min(subtotal, coupon.type === "percentage" ? Math.round(subtotal * Math.min(coupon.value, 100) / 100) : coupon.value);
  return { discount, coupon, error: "" };
}

export async function fulfillOrder(orderId: string, provider: string, transactionId: string) {
  const fulfilled = await db.transaction(async (tx) => {
    const [updated] = await tx.update(orders).set({ status: "completed", paymentStatus: "paid", provider, transactionId, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "pending"), eq(orders.status, "pending"))).returning();
    if (!updated) return null;
    await tx.insert(payments).values({ orderId, provider, status: "paid", amount: updated.total, transactionId });
    if (updated.couponCode) {
      const [coupon] = await tx.select().from(coupons).where(eq(coupons.code, updated.couponCode)).limit(1);
      if (coupon) {
        await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, coupon.id));
        await tx.insert(couponUsages).values({ couponId: coupon.id, orderId });
      }
    }
    return updated;
  });
  if (fulfilled) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
    const link = `${base}/checkout/success?order=${fulfilled.id}&key=${accessKeyForOrder(fulfilled.id)}`;
    try {
      await sendEmail(fulfilled.email, `Your Softly journals are ready — ${fulfilled.orderNumber}`, emailLayout("Your pages are ready ♡", `<p>Hi ${escapeHtml(fulfilled.customerName)},</p><p>Thank you for making room for yourself. Your order <strong>${escapeHtml(fulfilled.orderNumber)}</strong> is confirmed.</p><p><a href="${link}" style="display:inline-block;background:#29483f;color:white;padding:14px 22px;border-radius:6px;text-decoration:none">Download your journals →</a></p><p>Your secure link expires on ${fulfilled.accessExpiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. If you created an account, your purchases are also in My Downloads.</p>`));
    } catch (error) { console.error("Confirmation email error", error); }
  }
  return fulfilled;
}

export async function markOrderFailed(orderId: string) {
  await db.update(orders).set({ paymentStatus: "failed", status: "cancelled", updatedAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "pending")));
}
