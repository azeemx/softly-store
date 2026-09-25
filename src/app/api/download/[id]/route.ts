import { NextRequest } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { digitalFiles, orderItems, orders } from "@/db/schema";
import { getCurrentUser, hashToken } from "@/lib/auth";
import { readPrivatePdf } from "@/lib/storage";

export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [record] = await db.select({ item: orderItems, order: orders, file: digitalFiles }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(digitalFiles, eq(orderItems.productId, digitalFiles.productId)).where(eq(orderItems.id, id)).limit(1);
  if (!record || record.order.paymentStatus !== "paid" || record.order.status !== "completed") return new Response("Download unavailable", { status: 404 });
  const user = await getCurrentUser();
  const ownsOrder = !!user && record.order.userId === user.id;
  const key = request.nextUrl.searchParams.get("key") || "";
  const validKey = key.length === 64 && hashToken(key) === record.order.accessTokenHash && record.order.accessExpiresAt > new Date();
  if (!ownsOrder && !validKey) return new Response("This link is invalid or expired. Sign in or contact support.", { status: 403 });
  const limit = record.file.allowRedownload ? record.file.maxDownloads : 1;
  if (limit <= 0) return new Response("Download limit reached", { status: 403 });
  try {
    const file = await readPrivatePdf(record.file.storageKey);
    const [updated] = await db.update(orderItems).set({ downloads: sql`${orderItems.downloads} + 1` }).where(and(eq(orderItems.id, id), lt(orderItems.downloads, limit))).returning({ id: orderItems.id });
    if (!updated) return new Response("Download limit reached. Contact support if you need help.", { status: 403 });
    const filename = record.file.originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
    return new Response(new Uint8Array(file), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Content-Length": String(file.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { console.error("Download error", error); return new Response("File temporarily unavailable. Please contact support.", { status: 500 }); }
}
