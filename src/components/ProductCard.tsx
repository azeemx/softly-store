import Link from "next/link";
import type { Product } from "@/lib/store";
import { effectivePrice, formatPrice } from "@/lib/store";
import ProductArt from "@/components/ProductArt";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const price = effectivePrice(product);
  const free = price === 0;
  return <article className="product-card">
    <div className="product-card-media">
      <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} style={{ display: "block", height: "100%" }}><ProductArt product={product} /></Link>
      {free ? <span className="product-badge free">Free</span> : product.salePrice !== null && product.salePrice < product.price ? <span className="product-badge sale">On sale</span> : product.bestseller ? <span className="product-badge">Best seller</span> : null}
      <AddToCartButton variant="icon" item={{ id: product.id, slug: product.slug, name: product.name, subtitle: product.subtitle, price, originalPrice: product.price, theme: product.theme, coverImage: product.coverImage, type: product.type, author: product.author }} />
    </div>
    <div className="product-info"><span className="product-category">{product.type === "ebook" ? (product.author || "E-book") : (categoryName || "Digital journal")}</span><h3 className="product-name"><Link href={`/products/${product.slug}`}>{product.name}</Link></h3><p className="product-subtitle">{product.subtitle}</p><div className="product-price">{free ? <span className="price-free">Free</span> : formatPrice(price)}{price < product.price && <del>{formatPrice(product.price)}</del>}</div></div>
  </article>;
}
