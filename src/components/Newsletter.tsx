"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function subscribe(event: FormEvent) { event.preventDefault(); setLoading(true); setMessage(""); try { const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const data = await response.json(); setMessage(data.message || data.error); if (response.ok) setEmail(""); } catch { setMessage("Something went wrong. Please try again."); } setLoading(false); }
  return <section className="newsletter"><div className="container newsletter-grid"><div><span className="eyebrow" style={{ color: "#e7bda8" }}>LET'S STAY IN TOUCH</span><h2>A little note for your inbox.</h2><p>Thoughtful prompts, gentle reminders, and first dibs on new journals. No noise, ever.</p></div><div><form className="newsletter-form" onSubmit={subscribe}><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" aria-label="Email address" /><button disabled={loading} type="submit">{loading ? "Joining..." : "Join the list"}<ArrowRight size={16} /></button></form>{message && <p role="status">{message}</p>}<p>By subscribing, you agree to receive our occasional emails. Unsubscribe any time.</p></div></div></section>;
}
