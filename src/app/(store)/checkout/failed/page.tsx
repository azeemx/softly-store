import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
export const metadata: Metadata = { title: "Checkout Paused", robots: { index: false, follow: false } };
export default function FailedPage() { return <main className="success-page"><div className="success-icon" style={{ background: "#f6e8e0" }}><Heart size={30} /></div><span className="eyebrow">NO WORRIES AT ALL</span><h1>Let&apos;s try that again.</h1><p>Your payment wasn&apos;t completed, and your bag is right where you left it. Take your time — your journals will be here when you&apos;re ready.</p><div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 30, flexWrap: "wrap" }}><Link href="/checkout" className="button">Back to checkout <ArrowRight size={15} /></Link><Link href="/shop" className="button button-outline">Keep browsing</Link></div></main>; }
