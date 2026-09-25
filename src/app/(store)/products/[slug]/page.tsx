import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Printer, LockKeyhole, Plus, ArrowRight, Heart, BookOpen, Eye } from "lucide-react";
import { effectivePrice, formatPrice, getProductBySlug, getPublishedProducts } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import FreeClaimForm from "@/components/FreeClaimForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Not found" };
  return { title: product.seoTitle || (product.author ? `${product.name} by ${product.author}` : product.name), description: product.seoDescription || product.subtitle, alternates: { canonical: `/products/${product.slug}` }, openGraph: { title: product.name, description: product.subtitle, images: product.coverImage ? [product.coverImage] : ["/images/hero-journal.jpg"] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug); if (!product) notFound();
  const user = await getCurrentUser();
  const ebook = product.type === "ebook";
  const related = (await getPublishedProducts(ebook ? { type: "ebook" } : { category: product.category?.slug, type: "journal" })).filter((item) => item.id !== product.id).slice(0, 4);
  const price = effectivePrice(product);
  const free = price === 0;
  const canSample = !!product.downloadTerms && product.downloadTerms.previewPages > 0;
  const cartItem = { id: product.id, slug: product.slug, name: product.name, subtitle: product.subtitle, price, originalPrice: product.price, theme: product.theme, coverImage: product.coverImage, type: product.type, author: product.author };
  const jsonLd = { "@context": "https://schema.org", "@type": ebook ? "Book" : "Product", name: product.name, author: product.author ? { "@type": "Person", name: product.author } : undefined, description: product.description, image: product.coverImage ? [product.coverImage] : undefined, category: product.category?.name, offers: { "@type": "Offer", price: (price / 100).toFixed(2), priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products/${product.slug}` } };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><div className="container"><div className="breadcrumb"><Link href="/">Home</Link> / <Link href={ebook ? "/ebooks" : "/shop"}>{ebook ? "E-books" : "Shop"}</Link> / {product.category && !ebook && <><Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link> / </>}{product.name}</div><div className="product-detail"><ProductGallery product={product} images={product.images} /><div className="detail-info"><span className="eyebrow">{free ? "FREE " : ""}{ebook ? "E-BOOK" : product.category?.name || "DIGITAL JOURNAL"}</span><h1>{product.name}</h1>{product.author && <p className="detail-author">by {product.author}</p>}<p className="detail-subtitle">{product.subtitle}</p><div className="detail-price">{free ? <span className="price-free">Free</span> : formatPrice(price)}{price < product.price && <><del>{formatPrice(product.price)}</del><span className="save-badge">Save {Math.round((1 - price / product.price) * 100)}%</span></>}</div><p className="detail-description">{product.description}</p>
    <div className="detail-actions">{free ? <FreeClaimForm productId={product.id} productName={product.name} initialName={user?.name} initialEmail={user?.email} /> : <><AddToCartButton item={cartItem} /><AddToCartButton item={cartItem} variant="outline" buyNow /></>}{canSample && <Link href={`/read/sample/${product.slug}`} className="button button-outline sample-button"><Eye size={15} /> Read a free sample ({product.downloadTerms!.previewPages} {product.downloadTerms!.previewPages === 1 ? "page" : "pages"})</Link>}</div>
    <div className="detail-trust"><LockKeyhole size={13} /> Secure checkout &nbsp;·&nbsp; Read online instantly &nbsp;·&nbsp; PDF download</div><div className="detail-meta"><div><FileText size={16} /> {product.pages} pages</div><div><BookOpen size={16} /> Online reader</div><div><Download size={16} /> Instant PDF</div>{!ebook && <div><Printer size={16} /> {product.sizes}</div>}</div><div style={{ marginTop: 11 }}><details className="detail-accordion" open><summary>What&apos;s inside <Plus size={16} /></summary><ul>{product.includes.map((item) => <li key={item}>{item}</li>)}</ul></details><details className="detail-accordion"><summary>How reading works <Plus size={16} /></summary><p>{free ? "Enter your email and we'll unlock it instantly." : "After payment,"} you&apos;ll land in your reading room where you can read in the browser on any device, or download the PDF{ebook ? "" : " to print at home or use in your favorite note-taking app"}.</p></details><details className="detail-accordion"><summary>Digital delivery details <Plus size={16} /></summary><p>This is a digital product delivered as a PDF. Your secure guest link stays valid for {product.downloadTerms?.expiryDays ?? 30} days with up to {product.downloadTerms?.allowRedownload ? product.downloadTerms.maxDownloads : 1} downloads and unlimited online reading. Account holders keep eligible purchases in My Library.</p></details></div><p style={{ fontSize: 11, color: "#9aa59a", display: "flex", gap: 7, alignItems: "center", marginTop: 22 }}><Heart size={14} /> Made with care for your becoming.</p></div></div></div>
    {related.length > 0 && <section className="section-sm" style={{ background: "#fdfbf7" }}><div className="container"><div className="section-top"><div><span className="eyebrow">KEEP EXPLORING</span><h2 className="section-title">You might also <em style={{ fontWeight: 400 }}>love.</em></h2></div><Link href={ebook ? "/ebooks" : "/shop"} className="text-link">View all <ArrowRight size={15} /></Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} categoryName={product.category?.name} />)}</div></div></section>}
  </main>;
}
