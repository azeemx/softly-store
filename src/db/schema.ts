import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"),
  status: text("status").notNull().default("active"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("users_email_idx").on(table.email)]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (table) => [index("sessions_user_idx").on(table.userId)]);

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  type: text("type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("rose"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("journal"),
  author: text("author").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  coverImage: text("cover_image"),
  theme: text("theme").notNull().default("rose"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  includes: text("includes").array().notNull().default(sql`ARRAY[]::text[]`),
  pages: integer("pages").notNull().default(0),
  sizes: text("sizes").notNull().default("A4 & US Letter"),
  format: text("format").notNull().default("PDF"),
  featured: boolean("featured").notNull().default(false),
  bestseller: boolean("bestseller").notNull().default(false),
  status: text("status").notNull().default("draft"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("products_category_idx").on(table.categoryId), index("products_status_idx").on(table.status)]);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const digitalFiles = pgTable("digital_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().unique().references(() => products.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  maxDownloads: integer("max_downloads").notNull().default(5),
  expiryDays: integer("expiry_days").notNull().default(30),
  allowRedownload: boolean("allow_redownload").notNull().default(true),
  previewPages: integer("preview_pages").notNull().default(3),
  createdAt: createdAt(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percentage"),
  value: integer("value").notNull(),
  minSpend: integer("min_spend").notNull().default(0),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  customerName: text("customer_name").notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  couponCode: text("coupon_code"),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  provider: text("provider").notNull().default("demo"),
  providerSessionId: text("provider_session_id"),
  transactionId: text("transaction_id"),
  accessTokenHash: text("access_token_hash").notNull(),
  accessExpiresAt: timestamp("access_expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("orders_email_idx").on(table.email), index("orders_user_idx").on(table.userId)]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  downloads: integer("downloads").notNull().default(0),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  amount: integer("amount").notNull(),
  transactionId: text("transaction_id"),
  createdAt: createdAt(),
});

export const couponUsages = pgTable("coupon_usages", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  createdAt: createdAt(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  brandName: text("brand_name").notNull().default("softly."),
  logoUrl: text("logo_url").notNull().default(""),
  faviconUrl: text("favicon_url").notNull().default(""),
  tagline: text("tagline").notNull().default("Make space for what matters."),
  announcement: text("announcement").notNull().default("A little gift for your first order — use WELCOME15 for 15% off"),
  heroEyebrow: text("hero_eyebrow").notNull().default("DIGITAL JOURNALS FOR REAL LIFE"),
  heroTitle: text("hero_title").notNull().default("Make space for the person you're becoming."),
  heroDescription: text("hero_description").notNull().default("Thoughtfully made digital journals to help you slow down, tune in, and find your way back to yourself."),
  heroImage: text("hero_image").notNull().default("/images/hero-journal.jpg"),
  featuredTitle: text("featured_title").notNull().default("A little something for every season of you."),
  aboutTitle: text("about_title").notNull().default("The best conversations start with yourself."),
  aboutText: text("about_text").notNull().default("We're here for the messy middle, the little breakthroughs, and all the versions of you still unfolding. Our journals give your thoughts a soft place to land."),
  aboutImage: text("about_image").notNull().default("/images/story-journal.jpg"),
  supportEmail: text("support_email").notNull().default("hello@softly.studio"),
  instagramUrl: text("instagram_url").notNull().default(""),
  pinterestUrl: text("pinterest_url").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#29483f"),
  accentColor: text("accent_color").notNull().default("#e7a695"),
  footerText: text("footer_text").notNull().default("A quiet corner of the internet for becoming who you are."),
  aboutPage: text("about_page").notNull().default("We believe there is power in pausing. Softly was made to help you create small moments of reflection in a world that asks you to keep going. Every page is designed with care, curiosity, and the belief that you already have so much wisdom within you."),
  privacyPolicy: text("privacy_policy").notNull().default("We collect the information needed to process orders, deliver your digital products, and respond to your messages. We never sell your personal information. You may contact us to request access to or deletion of your data."),
  termsPolicy: text("terms_policy").notNull().default("Digital journals are for your personal use only. After purchase, you receive a non-transferable license to download and use the files. Redistribution, resale, or sharing of the files is not permitted."),
  taxRate: integer("tax_rate").notNull().default(0),
  seedVersion: integer("seed_version").notNull().default(1),
  refundPolicy: text("refund_policy").notNull().default("Because digital downloads are delivered immediately, purchases are generally final. If you have trouble accessing your file or received the wrong product, please contact us and we'll make it right."),
  updatedAt: updatedAt(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  detail: text("detail").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default("General inquiry"),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"),
  createdAt: createdAt(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: createdAt(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
});
