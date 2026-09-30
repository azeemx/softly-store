import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories, coupons, faqs, products, siteSettings, testimonials } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { adminError, audit, parseCategory, parseCoupon, parseProduct } from "@/lib/admin";

export const runtime = "nodejs";

const STRING_FIELDS = ["brandName", "logoUrl", "faviconUrl", "tagline", "announcement", "heroEyebrow", "heroTitle", "heroDescription", "heroImage", "featuredTitle", "aboutTitle", "aboutText", "aboutImage", "supportEmail", "instagramUrl", "pinterestUrl", "primaryColor", "accentColor", "footerText", "aboutPage", "privacyPolicy", "termsPolicy", "refundPolicy", "heroPrimaryLabel", "heroPrimaryHref", "heroSecondaryLabel", "heroSecondaryHref"] as const;
const LONG_FIELDS = ["privacyPolicy", "termsPolicy", "refundPolicy", "aboutPage"];
const IMAGE_FIELDS = ["heroImage", "aboutImage", "logoUrl", "faviconUrl"] as const;
const JSON_FIELDS = ["navItems", "footerLinks", "homepageSections"] as const;

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

/**
 * Site settings use a draft -> preview -> publish workflow:
 *   PUT {mode:"draft"}    save edits into settings_draft (live site unchanged)
 *   PUT {mode:"publish"}  copy settings_draft onto live columns (instant, no deploy)
 *   PUT {mode:"discard"}  throw the draft away
 *   PUT {fields...}       legacy/immediate publish of provided fields only
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const admin = await getAdmin(); if (!admin) return adminError("Unauthorized", 403);
  if ((await params).resource !== "settings") return adminError("Not found", 404);
  try {
    const body = await request.json();
    // Default = draft: edits never touch the live site until an explicit publish.
    const mode = ["draft", "publish", "discard"].includes(body.mode) ? String(body.mode) : "draft";
    const [current] = await db.select().from(siteSettings).limit(1);
    if (!current) return adminError("Settings unavailable", 404);

    if (mode === "publish") {
      const source = body.settingsDraft || current.settingsDraft;
      if (!source) return adminError("There are no draft changes to publish.");
      const [updated] = await db.update(siteSettings).set({ ...source, settingsDraft: null, draftUpdatedAt: null, updatedAt: new Date() }).returning();
      await audit(admin.id, "publish", "settings", "1", { keys: Object.keys(source as object) });
      return Response.json({ success: true, item: updated, published: true });
    }

    if (mode === "discard") {
      const [updated] = await db.update(siteSettings).set({ settingsDraft: null, draftUpdatedAt: null, updatedAt: new Date() }).returning();
      await audit(admin.id, "discard", "settings", "1");
      return Response.json({ success: true, item: updated, discarded: true });
    }

    // ---- build a partial draft object keyed by column names ----
    const updates: Record<string, unknown> = {};
    for (const field of STRING_FIELDS) {
      if (typeof body[field] !== "string") continue;
      updates[field] = String(body[field]).slice(0, LONG_FIELDS.includes(field) ? 12000 : 3000);
    }
    for (const color of ["primaryColor", "accentColor"] as const) {
      if (updates[color] !== undefined && !/^#[0-9a-fA-F]{6}$/.test(String(updates[color]))) return adminError("Colors must be hex values, like #29483f.");
    }
    for (const image of IMAGE_FIELDS) {
      const value = updates[image];
      if (value && !String(value).startsWith("/api/media/") && !String(value).startsWith("/uploads/") && !String(value).startsWith("/images/") && !String(value).startsWith("https://") && String(value) !== "") return adminError("Use an uploaded image or an HTTPS image URL.");
    }
    if (body.taxRatePercent !== undefined) {
      const percent = Number(body.taxRatePercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 50) return adminError("Tax rate must be between 0 and 50 percent.");
      updates.taxRate = Math.round(percent * 100);
    }
    if (Array.isArray(body.navItems)) {
      const nav = body.navItems.slice(0, 12).map((item: { label?: unknown; href?: unknown }) => ({ label: String(item.label || "").trim().slice(0, 40), href: String(item.href || "").trim().slice(0, 200) })).filter((item: { label: string; href: string }) => item.label && item.href);
      updates.navItems = nav;
    }
    if (Array.isArray(body.footerLinks)) {
      const cols = body.footerLinks.slice(0, 5).map((column: { title?: unknown; links?: unknown }) => ({
        title: String(column.title || "").trim().slice(0, 40),
        links: (Array.isArray(column.links) ? column.links : []).slice(0, 12).map((link: { label?: unknown; href?: unknown }) => ({ label: String(link.label || "").trim().slice(0, 40), href: String(link.href || "").trim().slice(0, 200) })).filter((link: { label: string; href: string }) => link.label && link.href),
      })).filter((column: { title: string }) => column.title);
      updates.footerLinks = cols;
    }
    if (Array.isArray(body.homepageSections)) {
      const allowed = ["categories", "journal", "ebooks", "free", "story", "how", "quote", "faq"];
      updates.homepageSections = body.homepageSections.filter((id: unknown) => typeof id === "string" && allowed.includes(id));
    }
    if (!Object.keys(updates).length) return adminError("No changes were sent.");

    const [updated] = await db.update(siteSettings).set({ settingsDraft: { ...(current.settingsDraft || {}), ...updates }, draftUpdatedAt: new Date() }).returning();
    await audit(admin.id, "draft", "settings", "1", { keys: Object.keys(updates) });
    return Response.json({ success: true, item: updated, draft: true, keys: Object.keys(updates) });
  } catch (error) { console.error("Settings error", error); return adminError("Could not save settings.", 400); }
}
