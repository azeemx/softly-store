import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/store";
import ReaderShell from "@/components/ReaderShell";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const product = await getProductBySlug((await params).slug); return { title: product ? `Free sample: ${product.name} | Softly` : "Sample", robots: { index: false } }; }
export const dynamic = "force-dynamic";

export default async function SamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product || !product.downloadTerms || product.downloadTerms.previewPages <= 0) notFound();
  return <ReaderShell sample title={product.name} author={product.author || undefined} src={`/api/preview/${product.slug}`} backHref={`/products/${product.slug}`} backLabel="Back to details" note={`You're reading the first ${product.downloadTerms.previewPages} ${product.downloadTerms.previewPages === 1 ? "page" : "pages"} for free. ${product.price === 0 ? "Get the full version free on the product page." : "Buy the full version to read it all and download the PDF."}`} />;
}
