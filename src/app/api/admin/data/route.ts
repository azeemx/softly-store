import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { categories, contactMessages, coupons, digitalFiles, faqs, newsletterSubscribers, orderItems, orders, productImages, products, siteSettings, testimonials, users } from "@/db/schema";
import { getAdmin, isDemoMode } from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";

export const runtime = "nodejs";
export async function GET() {
  await ensureSeeded();
  const admin = await getAdmin(); if (!admin) return Response.json({ error: "Unauthorized" }, { status: 403 });
  const [allProducts, allCategories, allFiles, allImages, allOrders, allItems, allCoupons, allFaqs, allTestimonials, allMessages, allSubscribers, allCustomers, settingsRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)), db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select({ id: digitalFiles.id, productId: digitalFiles.productId, originalName: digitalFiles.originalName, sizeBytes: digitalFiles.sizeBytes, maxDownloads: digitalFiles.maxDownloads, expiryDays: digitalFiles.expiryDays, allowRedownload: digitalFiles.allowRedownload, previewPages: digitalFiles.previewPages }).from(digitalFiles),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, email: orders.email, customerName: orders.customerName, subtotal: orders.subtotal, discount: orders.discount, total: orders.total, couponCode: orders.couponCode, currency: orders.currency, status: orders.status, paymentStatus: orders.paymentStatus, provider: orders.provider, transactionId: orders.transactionId, createdAt: orders.createdAt, userId: orders.userId }).from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems), db.select().from(coupons).orderBy(desc(coupons.createdAt)), db.select().from(faqs).orderBy(asc(faqs.sortOrder)), db.select().from(testimonials), db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)), db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)),
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt, emailVerifiedAt: users.emailVerifiedAt }).from(users).orderBy(desc(users.createdAt)), db.select().from(siteSettings),
  ]);
  const paid = allOrders.filter((order) => order.paymentStatus === "paid");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const chart = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); const dateString = date.toISOString().slice(0, 10); return { label: date.toLocaleDateString("en-US", { weekday: "short" }), value: paid.filter((order) => new Date(order.createdAt).toISOString().slice(0, 10) === dateString).reduce((sum, order) => sum + order.total, 0) }; });
  const paidIds = new Set(paid.map((order) => order.id));
  const topMap = new Map<string, { name: string; sales: number; revenue: number }>();
  allItems.filter((item) => paidIds.has(item.orderId)).forEach((item) => { const current = topMap.get(item.productName) || { name: item.productName, sales: 0, revenue: 0 }; current.sales++; current.revenue += item.unitPrice; topMap.set(item.productName, current); });
  const customerData = allCustomers.map((customer) => ({ ...customer, orderCount: allOrders.filter((order) => order.userId === customer.id).length, totalSpent: paid.filter((order) => order.userId === customer.id).reduce((sum, order) => sum + order.total, 0) }));
  return Response.json({ products: allProducts.map((product) => ({ ...product, file: allFiles.find((file) => file.productId === product.id) || null, images: allImages.filter((image) => image.productId === product.id) })), categories: allCategories, orders: allOrders.map((order) => ({ ...order, items: allItems.filter((item) => item.orderId === order.id) })), customers: customerData, coupons: allCoupons, faqs: allFaqs, testimonials: allTestimonials, messages: allMessages, subscribers: allSubscribers, settings: settingsRows[0], stats: { revenue, orderCount: paid.length, totalOrders: allOrders.length, customerCount: allCustomers.filter((user) => user.role === "customer").length, productCount: allProducts.length, conversion: allOrders.length ? Math.round((paid.length / allOrders.length) * 100) : 0, chart, topProducts: [...topMap.values()].sort((a, b) => b.sales - a.sales).slice(0, 5) }, integrations: { stripe: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET, email: !!process.env.RESEND_API_KEY, storage: !!process.env.R2_BUCKET, demo: isDemoMode() } });
}
