import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCategories, getPublishedProducts } from "@/lib/store";
import ProductCard from "@/components/ProductCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const category = (await getCategories()).find((item) => item.slug === slug); return { title: category ? `${category.name} Journals` : "Category", description: category?.description }; }
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const categories = await getCategories(); const category = categories.find((item) => item.slug === slug); if (!category) notFound();
  const products = await getPublishedProducts({ category: slug });
  return <main><div className="page-hero"><div className="container"><span className="eyebrow">EXPLORE THE COLLECTION</span><h1 className="section-title">{category.name} <em style={{ fontWeight: 400 }}>journals.</em></h1><p>{category.description} Find a little space to begin.</p></div></div><div className="container section-sm"><div className="breadcrumb"><Link href="/">Home</Link> / <Link href="/categories">Categories</Link> / {category.name}</div><div className="section-top"><div><span className="eyebrow">MADE FOR THIS MOMENT</span><h2 className="section-title">Pages for your journey.</h2></div><Link href="/shop" className="text-link">Shop all journals <ArrowRight size={15} /></Link></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} categoryName={category.name} />)}</div> : <div className="empty-state"><h2>New pages are on their way.</h2><Link href="/shop" className="button">Explore all journals <ArrowRight size={15} /></Link></div>}</div></main>;
}
