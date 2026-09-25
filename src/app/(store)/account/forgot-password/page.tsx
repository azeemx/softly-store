import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Reset Password" };
export default function ForgotPage() { return <main><AuthForm mode="forgot" /></main>; }
