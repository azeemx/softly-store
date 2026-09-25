import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { digitalFiles, productImages, products } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { adminError, audit } from "@/lib/admin";
import { saveImage, savePrivatePdf } from "@/lib/storage";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403);
  try {
    const form = await request.formData(); const file = form.get("file"); const kind = String(form.get("kind") || "image"); const productId = String(form.get("productId") || "");
    if (!(file instanceof File) || !["image", "preview", "pdf"].includes(kind)) return adminError("Choose a valid file.");
    if ((kind === "pdf" || kind === "preview") && !/^[0-9a-f-]{36}$/i.test(productId)) return adminError("Choose a product first.");
    if (kind !== "image") { const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1); if (!product) return adminError("Product not found.", 404); }
    const maxSize = kind === "pdf" ? 20 * 1024 * 1024 : 8 * 1024 * 1024;
    if (!file.size || file.size > maxSize) return adminError(`File must be under ${kind === "pdf" ? "20" : "8"} MB.`);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (kind === "pdf") {
      if (bytes.subarray(0, 5).toString() !== "%PDF-") return adminError("Only valid PDF files are allowed.");
      const storageKey = await savePrivatePdf(bytes);
      const maxDownloads = Math.max(1, Math.min(100, Number(form.get("maxDownloads")) || 5));
      const expiryDays = Math.max(1, Math.min(365, Number(form.get("expiryDays")) || 30));
      const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 150) || "journal.pdf";
      const previewPages = Math.max(0, Math.min(50, Math.round(Number(form.get("previewPages") ?? 3))));
      await db.insert(digitalFiles).values({ productId, storageKey, originalName, sizeBytes: bytes.length, maxDownloads, expiryDays, previewPages, allowRedownload: String(form.get("allowRedownload")) !== "false" }).onConflictDoUpdate({ target: digitalFiles.productId, set: { storageKey, originalName, sizeBytes: bytes.length, maxDownloads, expiryDays, previewPages, allowRedownload: String(form.get("allowRedownload")) !== "false" } });
      await audit(admin.id, "upload", "pdf", productId, { filename: originalName });
      return Response.json({ success: true, filename: originalName });
    }
    let extension: "jpg" | "png" | "webp";
    if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) extension = "jpg";
    else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = "png";
    else if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") extension = "webp";
    else return adminError("Only JPG, PNG, or WebP images are allowed.");
    const filename = await saveImage(bytes, extension);
    const url = `/api/media/${filename}`;
    if (kind === "preview") { const [image] = await db.insert(productImages).values({ productId, url }).returning(); await audit(admin.id, "upload", "preview", productId); return Response.json({ success: true, url, image }); }
    await audit(admin.id, "upload", "image", undefined, { filename }); return Response.json({ success: true, url });
  } catch (error) { console.error("Admin upload error", error); return adminError("Upload failed. Please try again.", 500); }
}
