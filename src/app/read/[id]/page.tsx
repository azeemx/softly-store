import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolvePurchasedItem } from "@/lib/access";
import ReaderShell from "@/components/ReaderShell";

export const metadata: Metadata = { title: "Reading room | Softly", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ key?: string }> }) {
  const { id } = await params;
  const { key = "" } = await searchParams;
  const access = await resolvePurchasedItem(id, key);
  if (!access) return <main className="success-page"><span className="eyebrow">READING ROOM</span><h1>We couldn&apos;t open this book.</h1><p>Your reading link may have expired, or you may need to sign in with the account that made the purchase.</p><div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}><Link className="button" href="/account/login">Sign in <ArrowRight size={14} /></Link><Link className="button button-outline" href="/contact">Contact support</Link></div></main>;
  const query = access.viaKey ? `?key=${encodeURIComponent(key)}` : "";
  return <ReaderShell title={access.item.productName} author={access.product?.author || undefined} src={`/api/read/${access.item.id}${query}`} downloadHref={`/api/download/${access.item.id}${query}`} backHref={access.ownsOrder ? "/account" : `/checkout/success?order=${access.order.id}&key=${encodeURIComponent(key)}`} backLabel={access.ownsOrder ? "My library" : "Your order"} note={access.viaKey ? "Tip: create an account with the email you used at checkout to keep this book in your library forever." : undefined} />;
}
