import { asc, desc, eq, and, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, coupons, digitalFiles, faqs, productImages, products, siteSettings, testimonials, users } from "@/db/schema";
import { cookies } from "next/headers";
import { getAdmin, hashPassword, isDemoMode, verifyPassword } from "@/lib/auth";
import { ensureSampleEbookPdf, ensureSamplePdf } from "@/lib/storage";

const ebookSeeds = [
  { name: "Pride and Prejudice", slug: "pride-and-prejudice", author: "Jane Austen", subtitle: "A timeless story of wit, pride, and unexpected love.", description: "Elizabeth Bennet navigates manners, marriage, and misjudgment in one of the most beloved novels ever written. Placeholder edition — upload your own file from the admin panel.", price: 499, theme: "rose", tags: ["classic", "romance", "fiction"], pages: 279, featured: true, bestseller: true },
  { name: "Meditations", slug: "meditations", author: "Marcus Aurelius", subtitle: "Private notes on living well, from a Stoic emperor.", description: "A quiet companion for difficult days. Marcus Aurelius reflects on discipline, kindness, and what remains within our control.", price: 0, theme: "sage", tags: ["stoic", "philosophy", "free"], pages: 164, featured: true, bestseller: true },
  { name: "The Great Gatsby", slug: "the-great-gatsby", author: "F. Scott Fitzgerald", subtitle: "Glamour, longing, and the green light across the bay.", description: "Fitzgerald's shimmering portrait of ambition and illusion in the Jazz Age.", price: 599, theme: "butter", tags: ["classic", "fiction", "american"], pages: 180, featured: true, bestseller: false },
  { name: "Alice's Adventures in Wonderland", slug: "alices-adventures-in-wonderland", author: "Lewis Carroll", subtitle: "Curiouser and curiouser.", description: "Fall down the rabbit hole into a world of riddles, tea parties, and playful nonsense.", price: 399, theme: "lavender", tags: ["classic", "children", "fantasy"], pages: 96, featured: true, bestseller: true },
  { name: "The Art of War", slug: "the-art-of-war", author: "Sun Tzu", subtitle: "Ancient strategy for modern decisions.", description: "Thirteen short chapters on preparation, patience, and knowing yourself. A free read for curious minds.", price: 0, theme: "olive", tags: ["strategy", "classic", "free"], pages: 68, featured: false, bestseller: false },
  { name: "Walden", slug: "walden", author: "Henry David Thoreau", subtitle: "Two years of simple living beside a quiet pond.", description: "Thoreau's meditation on nature, solitude, and living deliberately.", price: 449, theme: "sky", tags: ["nature", "classic", "slow living"], pages: 352, featured: false, bestseller: false },
  { name: "Little Women", slug: "little-women", author: "Louisa May Alcott", subtitle: "Four sisters, one unforgettable family.", description: "Warm, funny, and tender: the March sisters grow up through hardship, hope, and each other.", price: 549, theme: "peach", tags: ["classic", "family", "fiction"], pages: 449, featured: false, bestseller: true },
  { name: "Frankenstein", slug: "frankenstein", author: "Mary Shelley", subtitle: "The modern Prometheus.", description: "Mary Shelley's haunting tale of creation, responsibility, and loneliness.", price: 399, theme: "clay", tags: ["classic", "gothic", "fiction"], pages: 280, featured: false, bestseller: false },
];

const freebieSeeds = [
  { name: "7-Day Gratitude Starter", slug: "7-day-gratitude-starter", subtitle: "A free week of tiny, doable gratitude prompts.", description: "Try journaling for one week, for free. Seven gentle prompts, one page a day, no pressure. A lovely first taste of the Softly practice.", theme: "lavender", category: "gratitude", tags: ["free", "gratitude", "starter"], pages: 9 },
  { name: "Morning Pages Printable", slug: "morning-pages-printable", subtitle: "Free lined pages with a soft morning check-in.", description: "A free printable to begin your mornings with intention: a mood check-in, three priorities, and space to let your thoughts land.", theme: "peach", category: "mindfulness", tags: ["free", "morning", "printable"], pages: 6 },
  { name: "Weekly Reset Planner", slug: "weekly-reset-planner", subtitle: "A free one-page ritual to close the week softly.", description: "Reflect on what worked, let go of what didn't, and set one kind intention for the week ahead. Free to download and print as often as you like.", theme: "sage", category: "growth-goals", tags: ["free", "planner", "reset"], pages: 4 },
];

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;

const categorySeeds = [
  { name: "Self-discovery", slug: "self-discovery", description: "Get to know all the beautiful layers of you.", color: "rose", sortOrder: 1 },
  { name: "Mindfulness", slug: "mindfulness", description: "A gentle invitation to be here, now.", color: "sage", sortOrder: 2 },
  { name: "Gratitude", slug: "gratitude", description: "Find more wonder in the everyday.", color: "lavender", sortOrder: 3 },
  { name: "Growth & goals", slug: "growth-goals", description: "Move forward without leaving yourself behind.", color: "butter", sortOrder: 4 },
];

const productSeeds = [
  { name: "The Self-Reflection Journal", slug: "the-self-reflection-journal", subtitle: "Come home to yourself, one page at a time.", description: "A thoughtful collection of prompts to help you pause, make sense of your feelings, and reconnect with what matters most. There is no right way to fill these pages—just your way.", price: 1200, salePrice: 900, theme: "rose", category: "self-discovery", tags: ["reflection", "self care", "feelings"], includes: ["42 guided journaling pages", "Daily check-in prompts", "Reflection and intention-setting pages", "Printable and digital-friendly PDF"], pages: 42, featured: true, bestseller: true },
  { name: "30 Days of Gratitude", slug: "30-days-of-gratitude", subtitle: "Notice the good that's already here.", description: "A month of simple, soul-warming prompts to help you notice small joys and build a gratitude practice that feels like yours.", price: 900, salePrice: null, theme: "lavender", category: "gratitude", tags: ["gratitude", "30 day", "mindful"], includes: ["30 days of unique prompts", "Weekly reflection pages", "Morning and evening gratitude lists", "Printable and digital-friendly PDF"], pages: 38, featured: true, bestseller: true },
  { name: "The Gentle Reset", slug: "the-gentle-reset", subtitle: "Start again, softly.", description: "For the moments when life feels a little too loud. Give yourself permission to slow down, let go of what isn't serving you, and begin again at your own pace.", price: 1100, salePrice: null, theme: "sage", category: "mindfulness", tags: ["reset", "mindfulness", "wellness"], includes: ["35 guided pages", "Mindful check-ins and grounding exercises", "Let-go lists and new intention pages", "Printable and digital-friendly PDF"], pages: 35, featured: true, bestseller: true },
  { name: "A Softer Kind of Productivity", slug: "softer-kind-of-productivity", subtitle: "Do more of what matters, with less pressure.", description: "A compassionate planning companion for meaningful goals, gentle routines, and the kind of progress that doesn't ask you to burn out.", price: 1400, salePrice: 1100, theme: "butter", category: "growth-goals", tags: ["productivity", "goals", "planning"], includes: ["48 planning and reflection pages", "Weekly priorities and habit trackers", "Goal-setting without overwhelm", "Printable and digital-friendly PDF"], pages: 48, featured: true, bestseller: false },
  { name: "The Mindful Morning", slug: "the-mindful-morning", subtitle: "Begin your day with intention.", description: "A quiet morning ritual in journal form. Let each day start with a breath, a little gratitude, and space for what you need.", price: 800, salePrice: null, theme: "peach", category: "mindfulness", tags: ["morning", "ritual", "mindful"], includes: ["28 morning journal pages", "Daily intention prompts", "Simple breathing exercises", "Printable and digital-friendly PDF"], pages: 28, featured: false, bestseller: false },
  { name: "Notes to My Future Self", slug: "notes-to-my-future-self", subtitle: "A love letter to who you're becoming.", description: "Capture the thoughts, dreams, and little milestones you want your future self to remember. A meaningful keepsake for every chapter.", price: 1000, salePrice: null, theme: "sky", category: "self-discovery", tags: ["future self", "reflection", "growth"], includes: ["32 creative writing pages", "Letters to your future self", "Dream and milestone prompts", "Printable and digital-friendly PDF"], pages: 32, featured: false, bestseller: false },
  { name: "The Little Joys Journal", slug: "the-little-joys-journal", subtitle: "Collect the moments that make a life.", description: "An invitation to savor the ordinary magic all around you. Tiny moments deserve to be remembered, too.", price: 800, salePrice: null, theme: "clay", category: "gratitude", tags: ["joy", "gratitude", "everyday"], includes: ["30 joyful prompt pages", "Little wins tracker", "Memory-keeping pages", "Printable and digital-friendly PDF"], pages: 30, featured: false, bestseller: false },
  { name: "The Becoming Journal", slug: "the-becoming-journal", subtitle: "For every version of you along the way.", description: "An encouraging companion for change, growth, and all the in-between seasons. Reflect on where you've been and make room for what's next.", price: 1300, salePrice: null, theme: "olive", category: "growth-goals", tags: ["growth", "change", "goals"], includes: ["45 guided reflection pages", "Values and vision exercises", "Monthly growth check-ins", "Printable and digital-friendly PDF"], pages: 45, featured: false, bestseller: false },
];

let seedPromise: Promise<void> | null = null;
async function seed() {
  const [existingSettings] = await db.select({ id: siteSettings.id }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  const firstRun = !existingSettings;
  await db.insert(siteSettings).values({ id: 1 }).onConflictDoNothing();
  if (firstRun) await db.insert(categories).values(categorySeeds).onConflictDoNothing();
  const allCategories = await db.select().from(categories);
  for (const item of productSeeds) {
    const categoryId = allCategories.find((category) => category.slug === item.category)?.id;
    if (firstRun) await db.insert(products).values({ name: item.name, slug: item.slug, subtitle: item.subtitle, description: item.description, price: item.price, salePrice: item.salePrice, theme: item.theme, categoryId, tags: item.tags, includes: item.includes, pages: item.pages, featured: item.featured, bestseller: item.bestseller, status: "published", seoTitle: `${item.name} | Softly Digital Journals`, seoDescription: item.subtitle }).onConflictDoNothing();
    const [product] = await db.select({ id: products.id }).from(products).where(eq(products.slug, item.slug)).limit(1);
    if (product) {
      const sample = await ensureSamplePdf(item.slug, item.name, item.pages);
      const [existingFile] = await db.select().from(digitalFiles).where(eq(digitalFiles.productId, product.id)).limit(1);
      if (!existingFile && firstRun) await db.insert(digitalFiles).values({ productId: product.id, storageKey: sample.storageKey, originalName: `${item.slug}.pdf`, sizeBytes: sample.sizeBytes, maxDownloads: 5, expiryDays: 30 }).onConflictDoNothing();
      else if (existingFile && existingFile.storageKey.startsWith("local:samples/") && existingFile.storageKey !== sample.storageKey) await db.update(digitalFiles).set({ storageKey: sample.storageKey, sizeBytes: sample.sizeBytes }).where(eq(digitalFiles.id, existingFile.id));
    }
  }
  const [versionRow] = await db.select({ seedVersion: siteSettings.seedVersion }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if ((versionRow?.seedVersion ?? 1) < 2) {
    for (const book of ebookSeeds) {
      await db.insert(products).values({ name: book.name, slug: book.slug, type: "ebook", author: book.author, subtitle: book.subtitle, description: book.description, price: book.price, theme: book.theme, tags: book.tags, includes: ["Complete e-book as a PDF", "Read online instantly in the Softly reader", "Download to keep on any device", "Free sample of the first pages"], pages: book.pages, sizes: "PDF · reflowable-friendly", featured: book.featured, bestseller: book.bestseller, status: "published", seoTitle: `${book.name} by ${book.author} | Softly E-books`, seoDescription: book.subtitle }).onConflictDoNothing();
      const [row] = await db.select({ id: products.id }).from(products).where(eq(products.slug, book.slug)).limit(1);
      if (row) { const sample = await ensureSampleEbookPdf(book.slug, book.name, book.author, 12); await db.insert(digitalFiles).values({ productId: row.id, storageKey: sample.storageKey, originalName: `${book.slug}.pdf`, sizeBytes: sample.sizeBytes, maxDownloads: 10, expiryDays: 365, previewPages: 3 }).onConflictDoNothing(); }
    }
    for (const freebie of freebieSeeds) {
      const categoryId = allCategories.find((category) => category.slug === freebie.category)?.id;
      await db.insert(products).values({ name: freebie.name, slug: freebie.slug, type: "journal", subtitle: freebie.subtitle, description: freebie.description, price: 0, theme: freebie.theme, categoryId, tags: freebie.tags, includes: [`${freebie.pages} printable pages`, "Instant PDF download", "Read online or print at home", "Free for personal use"], pages: freebie.pages, featured: false, bestseller: false, status: "published", seoTitle: `${freebie.name} (Free) | Softly`, seoDescription: freebie.subtitle }).onConflictDoNothing();
      const [row] = await db.select({ id: products.id }).from(products).where(eq(products.slug, freebie.slug)).limit(1);
      if (row) { const sample = await ensureSamplePdf(freebie.slug, freebie.name, freebie.pages); await db.insert(digitalFiles).values({ productId: row.id, storageKey: sample.storageKey, originalName: `${freebie.slug}.pdf`, sizeBytes: sample.sizeBytes, maxDownloads: 20, expiryDays: 365, previewPages: 2 }).onConflictDoNothing(); }
    }
    await db.update(siteSettings).set({ seedVersion: 2 }).where(eq(siteSettings.id, 1));
  }
  if (firstRun) await db.insert(coupons).values({ code: "WELCOME15", type: "percentage", value: 15, active: true }).onConflictDoNothing();
  const existingFaqs = await db.select({ id: faqs.id }).from(faqs).limit(1);
  if (firstRun && !existingFaqs.length) await db.insert(faqs).values([
    { question: "How do digital journals work?", answer: "After checkout, you'll get instant access to a downloadable PDF. Use it on your tablet with a note-taking app, or print the pages at home as often as you like for personal use.", sortOrder: 1 },
    { question: "Can I print my journal?", answer: "Absolutely! Our journals are designed to look lovely printed. Each product page lists its supported paper sizes, usually A4 and US Letter.", sortOrder: 2 },
    { question: "Do I need an account to buy?", answer: "Not at all. You can check out as a guest and access your download from the secure link on your confirmation page and email. An account makes it easy to find past orders later.", sortOrder: 3 },
    { question: "What if I lose my download link?", answer: "If you have an account, visit My Downloads. Otherwise, contact us with your order email and we'll be happy to help.", sortOrder: 4 },
    { question: "What is your refund policy?", answer: "Because digital products are available immediately, purchases are generally final. If something isn't right with your file, reach out and we'll make it right.", sortOrder: 5 },
  ]);
  const existingTestimonials = await db.select({ id: testimonials.id }).from(testimonials).limit(1);
  if (firstRun && !existingTestimonials.length) await db.insert(testimonials).values([
    { quote: "This journal feels like a deep breath at the end of a long day. It's become my favorite little ritual.", name: "Olivia M.", detail: "The Self-Reflection Journal" },
    { quote: "The prompts are so thoughtful. They helped me slow down and actually hear what I needed.", name: "Maya R.", detail: "The Gentle Reset" },
    { quote: "Beautiful, easy to use, and genuinely helpful. I love having a quiet moment just for me.", name: "Emma L.", detail: "30 Days of Gratitude" },
  ]);
  const customAdminConfigured = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  const demoAdminEnabled = isDemoMode() && !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;
  const adminEmail = (customAdminConfigured ? process.env.ADMIN_EMAIL! : demoAdminEnabled ? "hello@softly.studio" : "").toLowerCase();
  const adminPassword = customAdminConfigured ? process.env.ADMIN_PASSWORD! : demoAdminEnabled ? "SoftlyDemo2026!" : "";
  if (adminEmail && adminPassword) {
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (!existingAdmin) await db.insert(users).values({ name: "Softly Admin", email: adminEmail, passwordHash: await hashPassword(adminPassword), role: "admin", emailVerifiedAt: new Date() }).onConflictDoNothing();
    else if (customAdminConfigured && existingAdmin.role === "admin" && (existingAdmin.status !== "active" || !(await verifyPassword(adminPassword, existingAdmin.passwordHash)))) await db.update(users).set({ passwordHash: await hashPassword(adminPassword), status: "active", updatedAt: new Date() }).where(eq(users.id, existingAdmin.id));
  }
  if (!demoAdminEnabled) {
    const [demoAdmin] = await db.select().from(users).where(eq(users.email, "hello@softly.studio")).limit(1);
    if (demoAdmin?.role === "admin" && (!customAdminConfigured || adminEmail !== demoAdmin.email) && await verifyPassword("SoftlyDemo2026!", demoAdmin.passwordHash)) await db.update(users).set({ status: "disabled" }).where(eq(users.id, demoAdmin.id));
  }
}

export async function ensureSeeded() {
  if (!seedPromise) seedPromise = seed().catch((error) => { seedPromise = null; throw error; });
  return seedPromise;
}

// Default (code-level) site structure. The admin can override any of these in
// Settings -> Site without touching code; these only apply when nothing is saved yet.
export const DEFAULT_NAV = [
  { label: "Journals", href: "/shop" },
  { label: "E-books", href: "/ebooks" },
  { label: "Free library", href: "/free" },
  { label: "Categories", href: "/categories" },
  { label: "Our story", href: "/about" },
];
export const DEFAULT_FOOTER = [
  { title: "Explore", links: [{ label: "Journals", href: "/shop" }, { label: "E-books", href: "/ebooks" }, { label: "Free library", href: "/free" }, { label: "Categories", href: "/categories" }, { label: "Our story", href: "/about" }, { label: "FAQs", href: "/faq" }] },
  { title: "Here to help", links: [{ label: "Contact us", href: "/contact" }, { label: "My account", href: "/account" }, { label: "My downloads", href: "/account" }] },
  { title: "The fine print", links: [{ label: "Privacy policy", href: "/policies/privacy" }, { label: "Terms & conditions", href: "/policies/terms" }, { label: "Refund policy", href: "/policies/refunds" }] },
];
// Homepage section ids in their default order. Toggle + reorder in the admin.
export const DEFAULT_SECTIONS = ["categories", "journal", "ebooks", "free", "story", "how", "quote", "faq"];

/**
 * Reads site settings. When an admin has enabled "preview draft" (signed-in admin
 * with the preview cookie), unpublished draft values are merged over the live ones,
 * so changes can be reviewed before publishing — no redeploy, purely DB-driven.
 */
export async function getSettings() {
  await ensureSeeded();
  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  if (!settings) return settings;
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("softly_preview")?.value === "1") {
      const admin = await getAdmin();
      if (admin && settings.settingsDraft) return { ...settings, ...settings.settingsDraft } as typeof settings;
    }
  } catch { /* No request context (build/CLI) -> live settings only. */ }
  return settings;
}
export async function getCategories() { await ensureSeeded(); return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)); }
export async function getFaqs() { await ensureSeeded(); return db.select().from(faqs).where(eq(faqs.active, true)).orderBy(asc(faqs.sortOrder)); }
export async function getTestimonials() { await ensureSeeded(); return db.select().from(testimonials).where(eq(testimonials.active, true)); }

export async function getPublishedProducts(options?: { category?: string; search?: string; sort?: string; sale?: boolean; featured?: boolean; type?: "journal" | "ebook"; free?: boolean; paidOnly?: boolean; limit?: number }) {
  await ensureSeeded();
  const conditions = [eq(products.status, "published")];
  if (options?.type) conditions.push(eq(products.type, options.type));
  if (options?.free) conditions.push(eq(products.price, 0));
  if (options?.paidOnly) conditions.push(sql`${products.price} > 0`);
  if (options?.category) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, options.category)).limit(1);
    if (!category) return [];
    conditions.push(eq(products.categoryId, category.id));
  }
  if (options?.search) conditions.push(or(ilike(products.name, `%${options.search}%`), ilike(products.author, `%${options.search}%`), ilike(products.description, `%${options.search}%`), sql`${options.search} = ANY(${products.tags})`)!);
  if (options?.sale) conditions.push(sql`${products.salePrice} IS NOT NULL AND ${products.salePrice} < ${products.price}`);
  if (options?.featured) conditions.push(eq(products.featured, true));
  const sort = options?.sort === "price-low" ? asc(sql`COALESCE(${products.salePrice}, ${products.price})`) : options?.sort === "price-high" ? desc(sql`COALESCE(${products.salePrice}, ${products.price})`) : options?.sort === "newest" ? desc(products.createdAt) : options?.sort === "popular" ? desc(products.bestseller) : asc(products.name);
  const query = db.select().from(products).where(and(...conditions)).orderBy(sort);
  return options?.limit ? query.limit(options.limit) : query;
}

export function isFree(product: Pick<Product, "price" | "salePrice">) { return effectivePrice(product) === 0; }

export async function getProductBySlug(slug: string) {
  await ensureSeeded();
  const [product] = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.status, "published"))).limit(1);
  if (!product) return null;
  const [category, images, files] = await Promise.all([
    product.categoryId ? db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1).then((r) => r[0] || null) : Promise.resolve(null),
    db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder)),
    db.select({ expiryDays: digitalFiles.expiryDays, maxDownloads: digitalFiles.maxDownloads, allowRedownload: digitalFiles.allowRedownload, previewPages: digitalFiles.previewPages }).from(digitalFiles).where(eq(digitalFiles.productId, product.id)).limit(1),
  ]);
  return { ...product, category, images, downloadTerms: files[0] || null };
}

export function formatPrice(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100); }
export function effectivePrice(product: Pick<Product, "price" | "salePrice">) { return product.salePrice !== null && product.salePrice < product.price ? product.salePrice : product.price; }