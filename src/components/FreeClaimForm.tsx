"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Gift } from "lucide-react";

// Lead-magnet flow: free items are delivered instantly in exchange for an email (with optional newsletter opt-in).
export default function FreeClaimForm({ productId, productName, initialName = "", initialEmail = "" }: { productId: string; productName: string; initialName?: string; initialEmail?: string }) {
  const [open, setOpen] = useState(false); const [name, setName] = useState(initialName); const [email, setEmail] = useState(initialEmail); const [subscribe, setSubscribe] = useState(true); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, subscribe, productIds: [productId], method: "free" }) });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Something went wrong. Please try again.");
      window.location.href = data.url;
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); setLoading(false); }
  }
  if (!open) return <button className="button" onClick={() => setOpen(true)}><Gift size={15} /> Get it free — read instantly</button>;
  return <form onSubmit={submit} className="free-claim"><p className="free-claim-title">Where should we send <em>{productName}</em>?</p><div className="form-grid"><input className="input" required minLength={2} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" /><input className="input" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" /></div><label className="checkbox-row"><input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} /> Also send me free prompts & new releases (unsubscribe anytime)</label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" type="submit" disabled={loading}>{loading ? "Unlocking..." : "Unlock my free copy"}<ArrowRight size={15} /></button><p className="checkout-fineprint">No payment details needed. Read online right away and download the PDF.</p></form>;
}
