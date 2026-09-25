import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/auth";
import { effectivePrice, ensureSeeded } from "@/lib/store";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!rateLimit(`cart-quote:${clientIp(request)}`, 90, 60 * 60 * 1000)) return Response.json({ error: "Please try again shortly." }, { status: 429 });
  try {
    await ensureSeeded();
    const body = await request.json();
    const ids = Array.isArray(body.productIds) ? [...new Set(body.productIds.filter((id: unknown) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))].slice(0, 30) as string[] : [];
    if (!ids.length) return Response.json({ items: [], total: 0 });
    const current = await db.select().from(products).where(and(inArray(products.id, ids), eq(products.status, "published")));
    const byId = new Map(current.map((product) => [product.id, product]));
    const items = ids.flatMap((id) => { const product = byId.get(id); return product ? [{ id: product.id, slug: product.slug, name: product.name, subtitle: product.subtitle, price: effectivePrice(product), originalPrice: product.price, theme: product.theme, coverImage: product.coverImage, type: product.type, author: product.author }] : []; });
    return Response.json({ items, total: items.reduce((sum, item) => sum + item.price, 0) });
  } catch { return Response.json({ error: "Could not refresh your bag right now." }, { status: 500 }); }
}
