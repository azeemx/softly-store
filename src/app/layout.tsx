// src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

const OG_IMAGE = {
  url: "/images/og-image.png",
  width: 1200,
  height: 630,
  alt: "Softly — Digital Journals for Real Life",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Softly — Digital Journals for Real Life", template: "%s | Softly" },
  description: "Thoughtfully made digital journals to help you slow down, tune in, and find your way back to yourself. Download instantly, journal your way.",
  openGraph: {
    title: "Softly — Digital Journals for Real Life",
    description: "A quiet corner for becoming who you are.",
    url: SITE_URL,
    siteName: "Softly",
    type: "website",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Softly — Digital Journals for Real Life",
    description: "A quiet corner for becoming who you are.",
    images: [OG_IMAGE.url],
  },
  icons: { icon: "/favicon.svg" },
  verification: {
    google: "PgYvqNZu8N3c8AnB-dxiwk199zN4cZ6Jx3JPnpku2og",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}