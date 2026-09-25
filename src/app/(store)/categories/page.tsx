import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flower2, Sun, Heart, Compass } from "lucide-react";
import { getCategories } from "@/lib/store";

export const metadata: Metadata = { title: "Explore Journal Categories", description: "Find digital journals for self-discovery, gratitude, mindfulness and personal growth." };
export default async function CategoriesPage() {
  const categories = await getCategories(); const icons = [Flower2, Sun, Heart, Compass];
  return <main><div className="page-hero"><div className="container"><span className="eyebrow">EXPLORE BY FEELING</span><h1 className="section-title">What are you making <em style={{ fontWeight: 400 }}>space for?</em></h1><p>Every season asks something different of us. Find the pages that feel right for yours.</p></div></div><div className="container section"><div className="category-grid">{categories.map((category, index) => { const Icon = icons[index % icons.length]; return <Link href={`/categories/${category.slug}`} className={`category-tile ${category.color}`} key={category.id} style={{ minHeight: 345 }}><span className="category-number">0{index + 1} / EXPLORE</span><div className="category-illustration"><Icon /></div><div className="category-bottom"><div><h3>{category.name}</h3><p>{category.description}</p></div><span className="category-arrow"><ArrowRight size={15} /></span></div></Link>; })}</div></div></main>;
}
