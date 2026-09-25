import { eq } from "drizzle-orm";
import { db } from "@/db";
import { digitalFiles, orderItems, orders, products } from "@/db/schema";
import { getCurrentUser, hashToken } from "@/lib/auth";

const UUID = /^[0-9a-f-]{36}$/i;

// Resolves whether the current request may access a purchased item, via account ownership or an unexpired receipt key.
export async function resolvePurchasedItem(itemId: string, key: string) {
  if (!UUID.test(itemId)) return null;
  const [record] = await db.select({ item: orderItems, order: orders, file: digitalFiles, product: products }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(digitalFiles, eq(orderItems.productId, digitalFiles.productId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.id, itemId)).limit(1);
  if (!record || record.order.paymentStatus !== "paid" || record.order.status !== "completed") return null;
  const user = await getCurrentUser();
  const ownsOrder = !!user && record.order.userId === user.id;
  const validKey = key.length === 64 && hashToken(key) === record.order.accessTokenHash && record.order.accessExpiresAt > new Date();
  if (!ownsOrder && !validKey) return null;
  return { ...record, ownsOrder, viaKey: validKey && !ownsOrder };
}
