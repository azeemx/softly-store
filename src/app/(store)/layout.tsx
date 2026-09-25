import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/store";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: `${settings.brandName} — Digital Journals for Real Life`, template: `%s | ${settings.brandName}` },
    description: settings.heroDescription,
    icons: { icon: settings.faviconUrl || "/favicon.svg" },
    openGraph: { title: `${settings.brandName} — Digital Journals for Real Life`, description: settings.heroDescription, images: [settings.heroImage], type: "website" },
  };
}

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const user = await getCurrentUser();
  const style = { "--forest": settings.primaryColor, "--accent": settings.accentColor } as CSSProperties;
  return <div className="site-shell" style={style}><CartProvider><Header brandName={settings.brandName} logoUrl={settings.logoUrl} announcement={settings.announcement} userName={user?.name} />{children}<Footer brandName={settings.brandName} logoUrl={settings.logoUrl} footerText={settings.footerText} supportEmail={settings.supportEmail} instagramUrl={settings.instagramUrl} pinterestUrl={settings.pinterestUrl} /></CartProvider></div>;
}
