import Link from "next/link";
import { Camera } from "lucide-react";

export default function Footer({ brandName, logoUrl, footerText, supportEmail, instagramUrl, pinterestUrl }: { brandName: string; logoUrl?: string; footerText: string; supportEmail: string; instagramUrl: string; pinterestUrl: string }) {
  return <footer className="site-footer"><div className="container"><div className="footer-grid">
    <div className="footer-about"><Link className="brand" href="/">{logoUrl ? <img className="brand-logo" src={logoUrl} alt={brandName} /> : brandName.endsWith(".") ? <>{brandName.slice(0, -1)}<span className="brand-dot">.</span></> : brandName}</Link><p>{footerText}</p>{instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Camera size={17} /></a>}{pinterestUrl && <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, fontSize: 12 }}>Pinterest ↗</a>}</div>
    <div className="footer-col"><h4>Explore</h4><Link href="/shop">Journals</Link><Link href="/ebooks">E-books</Link><Link href="/free">Free library</Link><Link href="/categories">Categories</Link><Link href="/about">Our story</Link><Link href="/faq">FAQs</Link></div>
    <div className="footer-col"><h4>Here to help</h4><Link href="/contact">Contact us</Link><Link href="/account">My account</Link><Link href="/account">My downloads</Link><a href={`mailto:${supportEmail}`}>{supportEmail}</a></div>
    <div className="footer-col"><h4>The fine print</h4><Link href="/policies/privacy">Privacy policy</Link><Link href="/policies/terms">Terms & conditions</Link><Link href="/policies/refunds">Refund policy</Link></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} {brandName} All rights reserved. Made for the moments in between.</span><span className="footer-credit">Designed &amp; developed by <a href="https://www.azeemx.dev" target="_blank" rel="noopener noreferrer">Azeem<span className="brand-dot">x</span></a></span></div></div></footer>;
}
