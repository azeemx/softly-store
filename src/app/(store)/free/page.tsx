import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gift, Eye, Mail, Sparkles, BookOpen } from "lucide-react";
import { getPublishedProducts } from "@/lib/store";
import ProductCard from "@/components/ProductCard";
import Newsletter from "@/components/Newsletter";

export const metadata: Metadata = {
  title: "Free Library — Free Journals, Printables & E-books",
  description: "Download free journaling printables, prompts, and classic e-books. Read free samples of every title. No payment needed — just your email.",
};

export default async function FreePage() {
  const [freebies, samples] = await Promise.all([
    getPublishedProducts({ free: true, sort: "newest" }),
    getPublishedProducts({ paidOnly: true, sort: "popular", limit: 6 }),
  ]);
  const journals = freebies.filter((item) => item.type !== "ebook");
  const books = freebies.filter((item) => item.type === "ebook");

  return (
    <main>
      <div className="page-hero free-hero">
        <div className="container">
          <span className="eyebrow">ON THE HOUSE</span>
          <h1 className="section-title">
            The free <em style={{ fontWeight: 400 }}>library.</em>
          </h1>
          <p>
            Little gifts to help you begin: free printables, starter journals, and classic books.
            Enter your email and read instantly — no card, ever.
          </p>
          <div className="hero-perks">
            <span>
              <Gift size={15} /> 100% free forever
            </span>
            <span>
              <Eye size={15} /> Read online instantly
            </span>
            <span>
              <Mail size={15} /> Sent to your inbox
            </span>
          </div>
        </div>
      </div>

      <div className="container section-sm">
        {journals.length > 0 && (
          <>
            <div className="section-top">
              <div>
                <span className="eyebrow">FREE PRINTABLES & STARTERS</span>
                <h2 className="section-title">
                  Try journaling, <em style={{ fontWeight: 400 }}>for free.</em>
                </h2>
              </div>
              <Link href="/shop" className="text-link">
                All journals <ArrowRight size={15} />
              </Link>
            </div>
            <div className="product-grid">
              {journals.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </>
        )}

        {books.length > 0 && (
          <>
            <div className="section-top" style={{ marginTop: "clamp(48px, 6vw, 76px)" }}>
              <div>
                <span className="eyebrow">FREE CLASSICS</span>
                <h2 className="section-title">
                  Books that belong <em style={{ fontWeight: 400 }}>to everyone.</em>
                </h2>
              </div>
              <Link href="/ebooks" className="text-link">
                All e-books <ArrowRight size={15} />
              </Link>
            </div>
            <div className="product-grid">
              {books.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </>
        )}

        {!freebies.length && (
          <div className="empty-state">
            <h2>Free goodies are on their way.</h2>
            <p className="muted">Join the newsletter below and we&apos;ll tell you first.</p>
          </div>
        )}

        <div className="sample-callout">
          <div>
            <span className="eyebrow" style={{ color: "#f3c7b3" }}>
              <Eye size={13} /> PEEK INSIDE ANYTHING
            </span>
            <h2>Every title has a free sample.</h2>
            <p>
              Not sure which journal or book is right for you? Read the first pages of any title
              right in your browser before you decide. No account or email needed.
            </p>
          </div>
          <div className="sample-callout-list">
            {samples.map((item) => (
              <Link key={item.id} href={`/read/sample/${item.slug}`} className="sample-link">
                <Sparkles size={14} color="#e7b8a4" />
                <span>
                  <strong>{item.name}</strong>
                  {item.author && <small style={{ display: "block", fontSize: 10, opacity: 0.8 }}>by {item.author}</small>}
                </span>
                <span style={{ fontSize: 11, color: "#d9e5db", flex: "none" }}>Sample</span>
                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Newsletter />
    </main>
  );
}
