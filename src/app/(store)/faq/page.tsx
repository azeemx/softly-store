import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FAQAccordion from "@/components/FAQAccordion";
import { getFaqs } from "@/lib/store";
export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Answers to your questions about Softly digital journals, downloads, printing, accounts, and orders." };
export default async function FaqPage() { const items = await getFaqs(); return <main><div className="page-hero"><div className="container"><span className="eyebrow">GOOD TO KNOW</span><h1 className="section-title">A few things you might <em style={{ fontWeight: 400 }}>wonder.</em></h1><p>All the little details about your journals and downloads, in one easy place.</p></div></div><div className="container section" style={{ maxWidth: 880 }}><FAQAccordion items={items} /><div className="notice" style={{ marginTop: 40, textAlign: "center" }}>Still have a question? <Link href="/contact" style={{ textDecoration: "underline", fontWeight: 700 }}>Send us a note <ArrowRight size={12} style={{ display: "inline" }} /></Link></div></div></main>; }
