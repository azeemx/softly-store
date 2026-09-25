import type { Metadata } from "next";
import CheckoutClient from "@/components/CheckoutClient";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default async function CheckoutPage() { const user = await getCurrentUser(); return <CheckoutClient initialName={user?.name || ""} initialEmail={user?.email || ""} signedIn={!!user} />; }
