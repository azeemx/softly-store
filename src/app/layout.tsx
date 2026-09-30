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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "Softly — Digital Journals for Real Life", template: "%s | Softly" },
  description: "Thoughtfully made digital journals to help you slow down, tune in, and find your way back to yourself. Download instantly, journal your way.",
  openGraph: { title: "Softly — Digital Journals for Real Life", description: "A quiet corner for becoming who you are.", type: "website", images: ["/images/hero-journal.jpg"] },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
