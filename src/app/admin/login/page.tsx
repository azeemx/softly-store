import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdmin, isDemoMode } from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Admin Sign In | Softly", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminLoginPage() { await ensureSeeded(); const admin = await getAdmin(); if (admin) redirect("/admin"); return <main style={{ minHeight: "100vh", background: "#f4f5ee", padding: "24px" }}><div style={{ maxWidth: 1120, margin: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link className="brand" href="/">softly<span className="brand-dot">.</span></Link><Link href="/" className="text-link"><ArrowLeft size={14} /> Back to shop</Link></div><AuthForm mode="login" admin demoMode={isDemoMode() && !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD} /></main>; }
