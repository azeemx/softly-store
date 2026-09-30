"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, UserRound, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function Header({ brandName, logoUrl, announcement, userName, links }: { brandName: string; logoUrl?: string; announcement: string; userName?: string | null; links?: { label: string; href: string }[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Menu items are fully admin-managed (Settings -> Site -> Navigation).
  const menu = links?.length ? links : [
    { href: "/shop", label: "Journals" },
    { href: "/ebooks", label: "E-books" },
    { href: "/free", label: "Free library" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "Our story" },
  ];

  return <>
    {announcement && <div className="announcement">✳ &nbsp;{announcement.includes("WELCOME15") ? <>{announcement.split("WELCOME15")[0]}<strong>WELCOME15</strong>{announcement.split("WELCOME15")[1]}</> : announcement}&nbsp; ✳</div>}
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${brandName} home`}>
          {logoUrl ? <img className="brand-logo" src={logoUrl} alt={brandName} /> : brandName.endsWith(".") ? <>{brandName.slice(0, -1)}<span className="brand-dot">.</span></> : brandName}
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {menu.map((link) => (
            <Link
              key={link.href}
              className={pathname === link.href || (link.href === "/shop" && pathname.startsWith("/products/")) ? "active" : ""}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
            aria-label="Search journals and books"
            title="Search"
          >
            <Search size={19} strokeWidth={1.8} />
          </button>
          <Link
            className="icon-button"
            href={userName ? "/account" : "/account/login"}
            aria-label={userName ? "My account" : "Sign in"}
            title={userName ? "Account" : "Sign in"}
          >
            <UserRound size={19} strokeWidth={1.8} />
          </Link>
          <Link
            className="icon-button"
            href="/cart"
            aria-label={`Shopping bag, ${count} items`}
            title="Shopping bag"
          >
            <ShoppingBag size={19} strokeWidth={1.8} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button
            className="icon-button mobile-toggle"
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="header-search">
          <div className="container">
            <form action="/shop" onSubmit={() => setSearchOpen(false)}>
              <Search size={20} color="var(--forest)" />
              <input
                autoFocus
                name="search"
                placeholder="Search gratitude, stoic, Jane Austen, mindfulness..."
                aria-label="Search products"
              />
              <button className="button button-small" type="submit" aria-label="Submit search">
                <span>Search</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {menu.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              <span>{link.label}</span>
              <ArrowRight size={15} color="#8a9b8f" />
            </Link>
          ))}
          <Link href="/faq" onClick={() => setMenuOpen(false)}>
            <span>FAQs</span>
            <ArrowRight size={15} color="#8a9b8f" />
          </Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>
            <span>Contact us</span>
            <ArrowRight size={15} color="#8a9b8f" />
          </Link>
          <Link href={userName ? "/account" : "/account/login"} onClick={() => setMenuOpen(false)}>
            <span>{userName ? "My account & downloads" : "Sign in / Register"}</span>
            <ArrowRight size={15} color="#8a9b8f" />
          </Link>
        </nav>
      )}
    </header>
  </>;
}
