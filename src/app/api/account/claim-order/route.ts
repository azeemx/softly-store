import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { clientIp, getCurrentUser, hashToken, rateLimit } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });
  if (!rateLimit(`claim:${user.id}:${clientIp(request)}`, 12, 60 * 60 * 1000)) return Response.json({ error: "Please try again later." }, { status: 429 });
  try {
    const body = await request.json();
    const orderId = String(body.orderId || "");
    const key = String(body.key || "");
    if (!/^[0-9a-f-]{36}$/i.test(orderId) || !/^[0-9a-f]{64}$/i.test(key)) return Response.json({ error: "Please enter a valid receipt link." }, { status: 400 });
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order || order.paymentStatus !== "paid" || order.status !== "completed" || order.email.toLowerCase() !== user.email.toLowerCase() || hashToken(key) !== order.accessTokenHash || order.accessExpiresAt < new Date()) return Response.json({ error: "We couldn't verify that purchase. Make sure you're signed in with the email used at checkout and your receipt link hasn't expired." }, { status: 403 });
    if (order.userId && order.userId !== user.id) return Response.json({ error: "This order belongs to another account." }, { status: 403 });
    if (!order.userId) await db.update(orders).set({ userId: user.id, updatedAt: new Date() }).where(and(eq(orders.id, order.id), isNull(orders.userId)));
    return Response.json({ success: true, message: "Lovely! Your journal is now in My Downloads." });
  } catch { return Response.json({ error: "Could not connect your order right now. Please try again." }, { status: 500 }); }
}
