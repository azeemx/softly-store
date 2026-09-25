import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories, coupons, faqs, products, siteSettings, testimonials } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { adminError, audit, parseCategory, parseCoupon, parseProduct } from "@/lib/admin";

export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403);
  const { resource } = await params;
  try {
    const body = await request.json(); let created: { id: string };
    if (resource === "products") { const [row] = await db.insert(products).values({ ...parseProduct(body), status: "draft" }).returning(); created = row; }
    else if (resource === "categories") { const [row] = await db.insert(categories).values(parseCategory(body)).returning(); created = row; }
    else if (resource === "coupons") { const [row] = await db.insert(coupons).values(parseCoupon(body)).returning(); created = row; }
    else if (resource === "faqs") { const question = String(body.question || "").trim().slice(0, 350); const answer = String(body.answer || "").trim().slice(0, 3000); if (!question || !answer) return adminError("Question and answer are required."); const [row] = await db.insert(faqs).values({ question, answer, sortOrder: Math.round(Number(body.sortOrder) || 0), active: body.active !== false }).returning(); created = row; }
    else if (resource === "testimonials") { const quote = String(body.quote || "").trim().slice(0, 1200); const name = String(body.name || "").trim().slice(0, 100); if (!quote || !name) return adminError("Quote and name are required."); const [row] = await db.insert(testimonials).values({ quote, name, detail: String(body.detail || "").trim().slice(0, 150), active: body.active !== false }).returning(); created = row; }
    else return adminError("Unknown resource", 404);
    await audit(admin.id, "create", resource, created.id);
    return Response.json({ success: true, item: created });
  } catch (error) { console.error("Admin create error", error); return adminError(error instanceof Error && !error.message.includes("duplicate key") ? error.message : "That name or code may already exist.", 400); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403);
  if ((await params).resource !== "settings") return adminError("Not found", 404);
  try {
    const body = await request.json();
    const [current] = await db.select().from(siteSettings).limit(1);
    if (!current) return adminError("Settings unavailable", 404);
    const fields = ["brandName", "logoUrl", "faviconUrl", "tagline", "announcement", "heroEyebrow", "heroTitle", "heroDescription", "heroImage", "featuredTitle", "aboutTitle", "aboutText", "aboutImage", "supportEmail", "instagramUrl", "pinterestUrl", "primaryColor", "accentColor", "footerText", "aboutPage", "privacyPolicy", "termsPolicy", "refundPolicy"] as const;
    const updates: Partial<typeof siteSettings.$inferInsert> = { updatedAt: new Date() };
    for (const field of fields) if (typeof body[field] === "string") (updates as Record<string, unknown>)[field] = String(body[field]).slice(0, ["privacyPolicy", "termsPolicy", "refundPolicy", "aboutPage"].includes(field) ? 12000 : 3000);
    if (body.taxRatePercent !== undefined) { const percent = Number(body.taxRatePercent); if (!Number.isFinite(percent) || percent < 0 || percent > 50) return adminError("Tax rate must be between 0 and 50 percent."); updates.taxRate = Math.round(percent * 100); }
    for (const color of ["primaryColor", "accentColor"] as const) if (updates[color] && !/^#[0-9a-fA-F]{6}$/.test(updates[color]!)) return adminError("Colors must be hex values, like #29483f.");
    for (const image of ["heroImage", "aboutImage", "logoUrl", "faviconUrl"] as const) if (updates[image] && !updates[image]!.startsWith("/api/media/") && !updates[image]!.startsWith("/uploads/") && !updates[image]!.startsWith("/images/") && !updates[image]!.startsWith("https://")) return adminError("Use an uploaded image or an HTTPS image URL.");
    const [updated] = await db.update(siteSettings).set(updates).returning();
    await audit(admin.id, "update", "settings", "1", { fields: Object.keys(updates) });
    return Response.json({ success: true, item: updated });
  } catch (error) { console.error("Settings error", error); return adminError("Could not save settings.", 400); }
}
