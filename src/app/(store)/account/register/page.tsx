import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
export const metadata: Metadata = { title: "Create an Account" };
export default function RegisterPage() { return <main><AuthForm mode="register" /></main>; }
