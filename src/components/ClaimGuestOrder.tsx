"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";

export default function ClaimGuestOrder({ orderId, accessKey }: { orderId?: string; accessKey?: string }) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function claim(event: FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    let id = orderId || "";
    let key = accessKey || "";
    if (!id || !key) {
      try {
        const receipt = new URL(link.trim(), window.location.origin);
        if (receipt.pathname !== "/checkout/success") throw new Error("Invalid receipt link");
        id = receipt.searchParams.get("order") || "";
        key = receipt.searchParams.get("key") || "";
      } catch { setError("Paste the full secure link from your purchase confirmation."); return; }
    }
    setLoading(true);
    try {
      const response = await fetch("/api/account/claim-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id, key }) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "We couldn't connect that order.");
      else { setMessage(result.message); setLink(""); router.refresh(); }
    } catch { setError("Couldn't connect just now. Please try again."); }
    setLoading(false);
  }

  if (orderId) return <div style={{ marginTop: 20, textAlign: "left" }}><form onSubmit={claim}><button className="button button-outline button-small" disabled={loading} type="submit"><Link2 size={13} />{loading ? "Saving your journal..." : "Save this guest order to My Downloads"}</button></form>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>;
  return <div className="summary-card" style={{ marginTop: 30, textAlign: "left" }}><h2 style={{ marginBottom: 6 }}>Bought as a guest?</h2><p className="muted" style={{ fontSize: 12, lineHeight: 1.75, margin: "0 0 18px" }}>Paste the secure receipt link from your order confirmation. If the purchase email matches your account, we&apos;ll add it here for easy re-downloads.</p><form onSubmit={claim} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input className="input" type="text" inputMode="url" style={{ flex: "1 1 235px" }} placeholder="Paste your receipt link here" aria-label="Secure order receipt link" required value={link} onChange={(event) => setLink(event.target.value)} /><button className="button button-small" type="submit" disabled={loading}>{loading ? "Connecting..." : "Connect purchase"}<ArrowRight size={14} /></button></form>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
