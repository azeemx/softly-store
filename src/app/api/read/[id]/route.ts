import { NextRequest } from "next/server";
import { resolvePurchasedItem } from "@/lib/access";
import { readPrivatePdf } from "@/lib/storage";

export const runtime = "nodejs";

// Streams a purchased PDF inline for the online reader. Reading does not consume download credits.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await resolvePurchasedItem(id, request.nextUrl.searchParams.get("key") || "");
  if (!access) return new Response("This reading link is invalid or expired. Sign in or contact support.", { status: 403 });
  try {
    const file = await readPrivatePdf(access.file.storageKey);
    return new Response(new Uint8Array(file), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${access.file.originalName.replace(/[^a-zA-Z0-9._-]/g, "-")}"`, "Content-Length": String(file.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" } });
  } catch (error) { console.error("Reader error", error); return new Response("File temporarily unavailable.", { status: 500 }); }
}
