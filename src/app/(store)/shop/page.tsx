import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { getCategories, getPublishedProducts } from "@/lib/store";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = { title: "Shop Digital Journals", description: "Explore thoughtful printable and digital journals for reflection, mindfulness, gratitude, and growth." };

type Params = { search?: string; category?: string; sort?: string; sale?: string };
export default async function ShopPage({ searchParams }: { searchParams: Promise<Params> }) {
  const query = await searchParams;
  const [categories, products] = await Promise.all([getCategories(), getPublishedProducts({ type: "journal", search: query.search?.trim().slice(0, 80), category: query.category, sort: query.sort, sale: query.sale === "on" })]);
  const currentCategory = categories.find((item) => item.slug === query.category);
  return <main><div className="page-hero"><div className="container"><span className="eyebrow">THE JOURNAL SHOP</span><h1 className="section-title">Find your next small <em style={{ fontWeight: 400 }}>beginning.</em></h1><p>A collection of gentle guides for whatever you&apos;re feeling, finding, or becoming. Take what you need.</p></div></div>
    <div className="container section-sm"><div className="shop-toolbar"><div className="category-pills"><Link className={`category-pill ${!query.category ? "active" : ""}`} href="/shop">All journals</Link>{categories.map((category) => <Link key={category.id} className={`category-pill ${query.category === category.slug ? "active" : ""}`} href={`/shop?category=${category.slug}`}>{category.name}</Link>)}</div><span className="muted" style={{ fontSize: 11 }}>{products.length} {products.length === 1 ? "journal" : "journals"}</span></div>
      <form className="shop-search-form" action="/shop" method="GET"><input className="input" type="search" name="search" placeholder="Search journals..." defaultValue={query.search || ""} aria-label="Search journals" /><select className="input" name="sort" defaultValue={query.sort || ""} aria-label="Sort products"><option value="">Sort: Featured</option><option value="newest">Newest first</option><option value="popular">Most loved</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select><label className="sale-toggle"><input type="checkbox" name="sale" defaultChecked={query.sale === "on"} /> On sale</label>{query.category && <input type="hidden" name="category" value={query.category} />}<button className="button button-small" type="submit"><Search size={14} /> Find journals</button></form>
      {currentCategory && <div style={{ marginBottom: 26, color: "#7b887c", fontSize: 13 }}>Showing {currentCategory.name.toLowerCase()} journals — {currentCategory.description}</div>}
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} categoryName={categories.find((category) => category.id === product.categoryId)?.name} />)}</div> : <div className="empty-state"><span style={{ fontSize: 30 }}>✳</span><h2>No journals found, just yet.</h2><p className="muted" style={{ fontSize: 13 }}>Try a different word or explore the whole collection.</p><Link href="/shop" className="button" style={{ marginTop: 15 }}>Browse all journals <ArrowRight size={15} /></Link></div>}
    </div></main>;
}
