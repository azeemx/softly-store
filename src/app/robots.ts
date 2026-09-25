import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000"; return { rules: { userAgent: "*", allow: ["/", "/api/media/"], disallow: ["/admin/", "/api/", "/account/", "/checkout/", "/cart"] }, sitemap: `${base}/sitemap.xml` }; }
