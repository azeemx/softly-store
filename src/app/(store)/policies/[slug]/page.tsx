import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSettings } from "@/lib/store";
const names: Record<string, string> = { privacy: "Privacy Policy", terms: "Terms & Conditions", refunds: "Refund Policy" };
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { return { title: names[(await params).slug] || "Policy" }; }
export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; if (!names[slug]) notFound(); const settings = await getSettings(); const content = slug === "privacy" ? settings.privacyPolicy : slug === "terms" ? settings.termsPolicy : settings.refundPolicy; return <main><div className="policy-content"><span className="eyebrow">THE IMPORTANT DETAILS</span><h1>{names[slug]}.</h1>{content.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}<h2>Questions?</h2><p>If anything is unclear, please <Link href="/contact" style={{ textDecoration: "underline", color: "#29483f" }}>get in touch</Link>. We&apos;re happy to help.</p><p style={{ fontSize: 11, color: "#a1aaa0", marginTop: 45 }}>Last updated: {new Date(settings.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></div></main>; }
