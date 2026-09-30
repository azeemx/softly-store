// app/(store)/layout.tsx
import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getCurrentUser, getAdmin } from "@/lib/auth";
import { DEFAULT_FOOTER, DEFAULT_NAV, getSettings } from "@/lib/store";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreviewBar from "@/components/PreviewBar";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://softly-store.vercel.app"),
    title: { default: `${settings.brandName} — Digital Journals for Real Life`, template: `%s | ${settings.brandName}` },
    description: settings.heroDescription,
    icons: { icon: settings.faviconUrl || "/favicon.svg" },
    openGraph: { title: `${settings.brandName} — Digital Journals for Real Life`, description: settings.heroDescription, images: [settings.heroImage], type: "website" },
  };
}

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const [user, admin] = await Promise.all([getCurrentUser(), getAdmin()]);
  const previewCookie = (await cookies()).get("softly_preview")?.value === "1";
  const previewing = previewCookie && !!admin;
  const style = { "--forest": settings.primaryColor, "--accent": settings.accentColor } as CSSProperties;
  const nav = settings.navItems?.length ? settings.navItems : DEFAULT_NAV;
  const footer = settings.footerLinks?.length ? settings.footerLinks : DEFAULT_FOOTER;

  return (
    <div className="site-shell" style={style}>
      <CartProvider>
        <Header brandName={settings.brandName} logoUrl={settings.logoUrl} announcement={settings.announcement} userName={user?.name} links={nav} />
        {children}
        <Footer brandName={settings.brandName} logoUrl={settings.logoUrl} footerText={settings.footerText} supportEmail={settings.supportEmail} instagramUrl={settings.instagramUrl} pinterestUrl={settings.pinterestUrl} columns={footer} />
      </CartProvider>
      {previewing && <PreviewBar />}
    </div>
  );
}