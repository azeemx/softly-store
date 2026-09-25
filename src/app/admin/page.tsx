import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";
import AdminApp from "@/components/admin/AdminApp";
export const metadata: Metadata = { title: "Studio Dashboard | Softly", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminPage() { await ensureSeeded(); const admin = await getAdmin(); if (!admin) redirect("/admin/login"); return <AdminApp adminName={admin.name} />; }
