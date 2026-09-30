import Link from "next/link";
import { Camera } from "lucide-react";

type Column = { title: string; links: { label: string; href: string }[] };

const DEFAULT_COLUMNS: Column[] = [
  { title: "Explore", links: [{ label: "Journals", href: "/shop" }, { label: "E-books", href: "/ebooks" }, { label: "Free library", href: "/free" }, { label: "Categories", href: "/categories" }, { label: "Our story", href: "/about" }, { label: "FAQs", href: "/faq" }] },
  { title: "Here to help", links: [{ label: "Contact us", href: "/contact" }, { label: "My account", href: "/account" }, { label: "My downloads", href: "/account" }] },
  { title: "The fine print", links: [{ label: "Privacy policy", href: "/policies/privacy" }, { label: "Terms & conditions", href: "/policies/terms" }, { label: "Refund policy", href: "/policies/refunds" }] },
];

export default function Footer({ brandName, logoUrl, footerText, supportEmail, instagramUrl, pinterestUrl, columns }: {
  brandName: string;
  logoUrl?: string;
  footerText: string;
  supportEmail: string;
  instagramUrl: string;
  pinterestUrl: string;
  columns?: Column[];
}) {
  const cols = columns?.length ? columns : DEFAULT_COLUMNS;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link className="brand" href="/">
              {logoUrl ? <img className="brand-logo" src={logoUrl} alt={brandName} /> : brandName.endsWith(".") ? <>{brandName.slice(0, -1)}<span className="brand-dot">.</span></> : brandName}
            </Link>
            <p>{footerText}</p>
            {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Camera size={17} /></a>}
            {pinterestUrl && <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, fontSize: 12 }}>Pinterest ↗</a>}
          </div>
          {cols.map((column) => (
            <div className="footer-col" key={column.title}>
              <h4>{column.title}</h4>
              {column.links.map((link) => <Link key={`${column.title}-${link.label}-${link.href}`} href={link.href}>{link.label}</Link>)}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {brandName} All rights reserved. Made for the moments in between.</span>
          <span className="footer-credit">Designed &amp; developed by <a href="https://www.azeemx.dev" target="_blank" rel="noopener noreferrer">Azeem<span className="brand-dot">x</span></a></span>
        </div>
      </div>
    </footer>
  );
}
