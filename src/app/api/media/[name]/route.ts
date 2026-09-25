import { NextRequest } from "next/server";
import { readImage } from "@/lib/storage";

export const runtime = "nodejs";
export async function GET(_request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const image = await readImage(name);
    const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new Response(new Uint8Array(image), { headers: { "Content-Type": type, "Content-Length": String(image.length), "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Image not found", { status: 404 }); }
}
