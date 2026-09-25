import type { MetadataRoute } from "next";
import { getCategories, getPublishedProducts } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  const pages = ["", "/shop", "/ebooks", "/free", "/categories", "/about", "/contact", "/faq", "/policies/privacy", "/policies/terms", "/policies/refunds"];
  return [...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" as const, priority: path === "" ? 1 : .6 })), ...categories.map((category) => ({ url: `${base}/categories/${category.slug}`, changeFrequency: "weekly" as const, priority: .7 })), ...products.map((product) => ({ url: `${base}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: .8 }))];
}
