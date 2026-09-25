"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusPoller() {
  const router = useRouter(); const [attempts, setAttempts] = useState(0);
  useEffect(() => { if (attempts >= 20) return; const timer = setTimeout(() => { router.refresh(); setAttempts((n) => n + 1); }, 3000); return () => clearTimeout(timer); }, [attempts, router]);
  return <p className="muted" style={{ fontSize: 11, marginTop: 14 }}>{attempts < 20 ? "Checking payment status automatically…" : "Still confirming. Refresh this page in a moment, or check your email for the confirmation link."}</p>;
}
