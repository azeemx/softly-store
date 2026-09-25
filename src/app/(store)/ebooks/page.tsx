import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Download, Eye, Search, Sparkles } from "lucide-react";
import { getPublishedProducts } from "@/lib/store";
import ProductCard from "@/components/ProductCard";
import ProductArt from "@/components/ProductArt";

export const metadata: Metadata = {
  title: "E-books — Read Online or Download",
  description: "Beloved classics and new reads as PDF e-books. Read a free sample, buy in seconds, and start reading instantly online or download to keep.",
};

export default async function EbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string; free?: string }>;
}) {
  const query = await searchParams;
  const books = await getPublishedProducts({
    type: "ebook",
    search: query.search?.trim().slice(0, 80),
    sort: query.sort,
    free: query.free === "on",
  });
  const featured = books.find((book) => book.bestseller) || books[0];

  return (
    <main>
      <div className="page-hero ebooks-hero">
        <div className="container">
          <span className="eyebrow">THE READING ROOM</span>
          <h1 className="section-title">
            Books to read <em style={{ fontWeight: 400 }}>anywhere.</em>
          </h1>
          <p>
            Read a free sample of any title, buy in seconds, and start reading
            instantly in your browser — or download the PDF and keep it forever.
          </p>
          <div className="hero-perks">
            <span>
              <Eye size={15} /> Free samples
            </span>
            <span>
              <BookOpen size={15} /> Read online instantly
            </span>
            <span>
              <Download size={15} /> PDF to keep
            </span>
          </div>
        </div>
      </div>

      <div className="container section-sm">
        <form className="shop-search-form" action="/ebooks" method="GET">
          <input
            className="input"
            type="search"
            name="search"
            placeholder="Search titles or authors..."
            defaultValue={query.search || ""}
            aria-label="Search e-books"
          />
          <select
            className="input"
            name="sort"
            defaultValue={query.sort || ""}
            aria-label="Sort e-books"
          >
            <option value="">Sort: Featured</option>
            <option value="newest">Newest first</option>
            <option value="popular">Most loved</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
          </select>
          <label className="sale-toggle">
            <input type="checkbox" name="free" defaultChecked={query.free === "on"} /> Free only
          </label>
          <button className="button button-small" type="submit">
            <Search size={14} /> <span>Find books</span>
          </button>
        </form>

        {featured && !query.search && (
          <div className="featured-book">
            <div className="featured-book-copy">
              <span className="eyebrow">
                <Sparkles size={13} /> READER FAVOURITE
              </span>
              <h2 className="section-title" style={{ fontSize: "clamp(30px, 3.8vw, 46px)", margin: "12px 0 6px" }}>
                {featured.name}
              </h2>
              {featured.author && (
                <p className="detail-author" style={{ margin: 0, color: "var(--forest)", fontSize: 15 }}>
                  by {featured.author}
                </p>
              )}
              <p className="section-lead" style={{ margin: "14px 0 24px" }}>
                {featured.subtitle}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href={`/products/${featured.slug}`} className="button">
                  {featured.price === 0 ? "Read it free" : "View the book"} <ArrowRight size={14} />
                </Link>
                <Link href={`/read/sample/${featured.slug}`} className="button button-outline">
                  <Eye size={14} /> Free sample
                </Link>
              </div>
            </div>
            <Link
              href={`/products/${featured.slug}`}
              className="featured-book-art"
              aria-label={`View ${featured.name}`}
            >
              <ProductArt product={featured} large />
            </Link>
          </div>
        )}

        <div className="section-top" style={{ marginTop: 10 }}>
          <div>
            <span className="eyebrow">ALL E-BOOKS</span>
            <h2 className="section-title">
              {books.length} {books.length === 1 ? "title" : "titles"} on the shelf.
            </h2>
          </div>
          <Link href="/free" className="text-link">
            Free library <ArrowRight size={15} />
          </Link>
        </div>

        {books.length ? (
          <div className="product-grid">
            {books.map((book) => (
              <ProductCard key={book.id} product={book} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No books found, just yet.</h2>
            <p className="muted" style={{ margin: "6px 0 16px" }}>
              Try searching with another word or clear your filters.
            </p>
            <Link href="/ebooks" className="button">
              See all e-books <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
