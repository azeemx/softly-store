import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Verify Email" };
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <main><AuthForm mode="verify" token={token || ""} /></main>; }
