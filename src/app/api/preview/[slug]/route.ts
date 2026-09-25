import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { digitalFiles, products } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/auth";
import { buildPreviewPdf } from "@/lib/storage";

export const runtime = "nodejs";

// Public free sample: only the first N pages (admin-controlled) are ever sent to the browser.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return new Response("Not found", { status: 404 });
  if (!rateLimit(`preview:${clientIp(request)}`, 120, 60 * 60 * 1000)) return new Response("Too many requests", { status: 429 });
  const [record] = await db.select({ file: digitalFiles }).from(products).innerJoin(digitalFiles, eq(digitalFiles.productId, products.id)).where(and(eq(products.slug, slug), eq(products.status, "published"))).limit(1);
  if (!record || record.file.previewPages <= 0) return new Response("No sample available", { status: 404 });
  try {
    const sample = await buildPreviewPdf(record.file.storageKey, record.file.previewPages);
    return new Response(new Uint8Array(sample), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${slug}-sample.pdf"`, "Content-Length": String(sample.length), "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { console.error("Preview error", error); return new Response("Sample temporarily unavailable.", { status: 500 }); }
}
