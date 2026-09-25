import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { digitalFiles, products, siteSettings } from "@/db/schema";
import { getCouponDiscount } from "@/lib/payments";
import { effectivePrice, ensureSeeded } from "@/lib/store";

export const UUID = /^[0-9a-f-]{36}$/i;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseProductIds(input: unknown, max = 20) {
  return Array.isArray(input) ? ([...new Set(input.filter((id: unknown) => typeof id === "string" && UUID.test(id)))].slice(0, max) as string[]) : [];
}

export async function getTaxRate() {
  const [row] = await db.select({ taxRate: siteSettings.taxRate }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row?.taxRate ?? 0;
}

export function calculateTax(amount: number, taxRate: number) { return Math.max(0, Math.round((amount * taxRate) / 10000)); }

export async function priceCart(ids: string[], couponCode: string) {
  await ensureSeeded();
  if (!ids.length) return { error: "Please add something to your bag first." } as const;
  const selected = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.status, "published")));
  if (selected.length !== ids.length) return { error: "An item in your bag is no longer available. Please refresh your bag." } as const;
  const files = await db.select({ productId: digitalFiles.productId, expiryDays: digitalFiles.expiryDays }).from(digitalFiles).where(inArray(digitalFiles.productId, ids));
  if (files.length !== ids.length) return { error: "An item is temporarily unavailable for delivery. Please contact support." } as const;
  const lines = ids.map((id) => { const product = selected.find((item) => item.id === id)!; return { product, unitPrice: effectivePrice(product) }; });
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice, 0);
  const code = couponCode.trim().toUpperCase().slice(0, 40);
  const couponResult = await getCouponDiscount(code, subtotal);
  if (code && couponResult.error) return { error: couponResult.error } as const;
  const taxRate = await getTaxRate();
  const taxable = subtotal - couponResult.discount;
  const tax = calculateTax(taxable, taxRate);
  return { lines, subtotal, discount: couponResult.discount, coupon: couponResult.coupon, taxRate, tax, total: taxable + tax, expiryDays: Math.min(...files.map((file) => file.expiryDays)) } as const;
}

export type CartPricing = Exclude<Awaited<ReturnType<typeof priceCart>>, { error: string }>;
