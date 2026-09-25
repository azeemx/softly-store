import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Choose a New Password" };
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <main><AuthForm mode="reset" token={token || ""} /></main>; }
