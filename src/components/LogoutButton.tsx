"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton({ admin = false }: { admin?: boolean }) { const router = useRouter(); return <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push(admin ? "/admin/login" : "/"); router.refresh(); }}>{admin ? "Sign out" : "Sign out"}</button>; }
