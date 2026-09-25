"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ArrowRight, ArrowLeft, LockKeyhole, Tag, ShieldCheck, CreditCard, Wallet, Sparkles, BookOpen } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import CheckoutSteps from "@/components/CheckoutSteps";
import ProductArt from "@/components/ProductArt";

type Quote = { subtotal: number; discount: number; tax: number; taxRate: number; total: number; code: string; lines: { id: string; name: string; unitPrice: number }[] };
type Config = { demo: boolean; card: boolean; hosted: boolean; publishableKey: string | null };
type Method = "card" | "hosted" | "preview";

function CardPaymentForm({ successUrl, email, name, amount, onError, disabled }: { successUrl: string; email: string; name: string; amount: number; onError: (message: string) => void; disabled: boolean }) {
  const stripe = useStripe(); const elements = useElements(); const [paying, setPaying] = useState(false); const [ready, setReady] = useState(false);
  async function pay(event: FormEvent) {
    event.preventDefault(); if (!stripe || !elements) return; setPaying(true); onError("");
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: successUrl, receipt_email: email, payment_method_data: { billing_details: { name, email } } } });
    if (error) { onError(error.message || "Payment couldn't be completed. Please check your details and try again."); setPaying(false); }
  }
  return <form onSubmit={pay} className="card-form"><PaymentElement options={{ layout: "tabs", defaultValues: { billingDetails: { name, email } } }} onReady={() => setReady(true)} /><p className="checkout-fineprint"><LockKeyhole size={12} /> Card details are encrypted and sent directly to Stripe. We never see or store your card number. Stripe Link can remember your details for faster checkout next time.</p><button className="button process-button" type="submit" disabled={!stripe || !ready || paying || disabled}>{paying ? "Processing your payment..." : `Process Order · ${formatPrice(amount)}`}</button></form>;
}

export default function CheckoutClient({ initialName, initialEmail, signedIn }: { initialName: string; initialEmail: string; signedIn: boolean }) {
  const { items, ready, refreshCart } = useCart();
  const [config, setConfig] = useState<Config | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialName); const [email, setEmail] = useState(initialEmail); const [country, setCountry] = useState(""); const [subscribe, setSubscribe] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null); const [couponInput, setCouponInput] = useState(""); const [couponCode, setCouponCode] = useState(""); const [couponError, setCouponError] = useState(""); const [checking, setChecking] = useState(false);
  const [method, setMethod] = useState<Method>("card");
  const [intent, setIntent] = useState<{ clientSecret: string; orderId: string; successUrl: string; key: string } | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [refreshing, setRefreshing] = useState(true);
  const productIds = useMemo(() => items.map((item) => item.id), [items]);
  const idsKey = productIds.join(",");
  const freeOnly = items.length > 0 && items.every((item) => item.price === 0);

  useEffect(() => { fetch("/api/checkout").then((r) => r.json()).then((data: Config) => { setConfig(data); if (data.publishableKey) setStripePromise(loadStripe(data.publishableKey)); setMethod(data.demo ? "preview" : data.card ? "card" : "hosted"); }).catch(() => setConfig({ demo: false, card: false, hosted: false, publishableKey: null })); }, []);
  useEffect(() => { if (!ready) return; let active = true; refreshCart().finally(() => { if (active) setRefreshing(false); }); return () => { active = false; }; }, [ready, refreshCart]);

  const fetchQuote = useCallback(async (code: string) => {
    if (!productIds.length) { setQuote(null); return null; }
    const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, productIds }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Couldn't price your order.");
    setQuote(data); return data as Quote;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);
  useEffect(() => { if (ready && !refreshing) fetchQuote(couponCode).catch(() => setQuote(null)); }, [ready, refreshing, fetchQuote, couponCode]);
  useEffect(() => { setIntent(null); }, [idsKey]);

  async function applyCoupon(event: FormEvent) {
    event.preventDefault(); setCouponError(""); setChecking(true);
    try {
      const code = couponInput.trim().toUpperCase();
      if (intent) {
        const response = await fetch(`/api/checkout/${intent.orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ couponCode: code, key: intent.key }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error);
      }
      const result = await fetchQuote(code); setCouponCode(result?.code || ""); if (code && !result?.code) setCouponError("This code couldn't be applied.");
    } catch (err) { setCouponError(err instanceof Error ? err.message : "Please try again."); }
    setChecking(false);
  }

  function continueToPayment(event: FormEvent) { event.preventDefault(); setError(""); setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function startOrder(selected: Method) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, country, subscribe, productIds, couponCode, method: freeOnly ? "free" : selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (data.clientSecret) { const key = new URL(data.successUrl).searchParams.get("key") || ""; setIntent({ clientSecret: data.clientSecret, orderId: data.orderId, successUrl: data.successUrl, key }); }
      else if (data.url) { sessionStorage.setItem("softly_pending_order", JSON.stringify({ orderId: data.orderId, productIds })); window.location.href = data.url; return; }
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't connect. Please try again."); }
    setLoading(false);
  }
  useEffect(() => { if (intent) sessionStorage.setItem("softly_pending_order", JSON.stringify({ orderId: intent.orderId, productIds })); }, [intent, productIds]);

  const total = quote?.total ?? items.reduce((sum, item) => sum + item.price, 0);
  const methods: { id: Method; label: string; detail: string; icon: typeof CreditCard; available: boolean }[] = [
    { id: "card", label: "Credit or debit card", detail: "Visa, Mastercard, Amex, Apple Pay, Google Pay, Link", icon: CreditCard, available: !!config?.card && !config?.demo },
    { id: "hosted", label: "More payment options", detail: "Pay on Stripe's secure page with local methods and wallets", icon: Wallet, available: !!config?.hosted && !config?.demo },
    { id: "preview", label: "Preview payment", detail: "No card needed — this demo store doesn't charge anything", icon: Sparkles, available: !!config?.demo },
  ];

  if (ready && !items.length) return <main><div className="container narrow-page" style={{ textAlign: "center" }}><CheckoutSteps current={1} /><h1>Your bag is empty.</h1><p className="muted">Add a journal or e-book and come right back.</p><Link href="/shop" className="button" style={{ marginTop: 18 }}>Browse the shop <ArrowRight size={14} /></Link></div></main>;

  return <main><div className="container checkout-page">
    <CheckoutSteps current={step} freeOnly={freeOnly} />
    <div className="checkout-layout" style={{ paddingTop: 30 }}>
      <div>
        {step === 1 && <form onSubmit={continueToPayment} className="checkout-form"><h2>Your details</h2><p>Where should we deliver your {freeOnly ? "free files" : "order"}? {signedIn ? "We've filled in your account details." : "No account needed — check out as a guest."}</p>
          <div className="form-grid"><div className="field"><label className="field-label" htmlFor="checkout-name">Full name <em>(required)</em></label><input className="input" id="checkout-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" /></div><div className="field"><label className="field-label" htmlFor="checkout-email">Email address <em>(required)</em></label><input className="input" id="checkout-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div></div>
          <div className="field"><label className="field-label" htmlFor="checkout-country">Country / region <span className="muted">(optional)</span></label><input className="input" id="checkout-country" autoComplete="country-name" maxLength={60} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Where are you reading from?" /></div>
          <label className="checkbox-row" style={{ margin: "4px 0 10px" }}><input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} /> Send me free prompts, new releases, and reader-only offers (unsubscribe any time)</label>
          <div className="notice">♡ &nbsp; After {freeOnly ? "you confirm" : "payment"}, you&apos;ll be able to read online instantly and download the PDF. Your secure link is also emailed to you when email delivery is configured.</div>
          <button className="button" type="submit" disabled={!ready || refreshing || items.length === 0}>{refreshing ? "Checking your bag..." : freeOnly ? "Continue to review" : "Continue to payment"}<ArrowRight size={15} /></button>
          {!signedIn && <p className="checkout-fineprint" style={{ justifyContent: "center" }}>Already have an account? <Link href="/account/login" style={{ textDecoration: "underline", marginLeft: 4 }}>Sign in</Link></p>}
        </form>}

        {step === 2 && <div className="checkout-form">
          <button type="button" className="text-link" onClick={() => { setStep(1); }} style={{ marginBottom: 18 }}><ArrowLeft size={13} /> Edit details</button>
          <h2>{freeOnly ? "Review your free order" : "Payment details"}</h2>
          <p>{freeOnly ? `We'll deliver to ${email}.` : `Delivering to ${email}. Choose how you'd like to pay — every option is encrypted and secure.`}</p>
          {!freeOnly && <div className="method-list">{methods.filter((m) => m.available).map((m) => { const Icon = m.icon; return <label key={m.id} className={`method-option ${method === m.id ? "active" : ""} ${intent && m.id !== "card" ? "locked" : ""}`}><input type="radio" name="method" value={m.id} checked={method === m.id} disabled={!!intent && m.id !== "card"} onChange={() => setMethod(m.id)} /><Icon size={18} /><span><strong>{m.label}</strong><small>{m.detail}</small></span></label>; })}{config && !config.demo && !config.card && !config.hosted && <div className="notice demo">Payments aren&apos;t configured yet. Please contact support.</div>}</div>}
          <form className="coupon-form" onSubmit={applyCoupon} style={{ margin: "22px 0 6px" }}><div style={{ flex: 1 }}><label className="field-label" htmlFor="coupon">Gift certificate or coupon code</label><input className="input" id="coupon" placeholder="Enter code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} /></div><button className="button button-small" type="submit" disabled={checking} style={{ alignSelf: "flex-end" }}><Tag size={13} />{checking ? "..." : "Apply"}</button></form>
          {couponError && <p className="form-error">{couponError}</p>}{quote?.code && <p className="form-success">✳ {quote.code} applied — you save {formatPrice(quote.discount)}.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {freeOnly ? <button className="button process-button" onClick={() => startOrder("preview")} disabled={loading}>{loading ? "Preparing your files..." : "Get my free files"}<BookOpen size={15} /></button>
            : method === "card" ? (intent && stripePromise ? <Elements key={intent.clientSecret} stripe={stripePromise} options={{ clientSecret: intent.clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#29483f", borderRadius: "5px", fontFamily: "DM Sans, Arial, sans-serif" } } }}><CardPaymentForm successUrl={intent.successUrl} email={email} name={name} amount={total} onError={setError} disabled={checking} /></Elements>
              : <button className="button process-button" onClick={() => startOrder("card")} disabled={loading || !quote}>{loading ? "Preparing secure payment..." : "Continue to card details"}<CreditCard size={15} /></button>)
            : <button className="button process-button" onClick={() => startOrder(method)} disabled={loading || !quote}>{loading ? "Preparing your order..." : method === "preview" ? `Process Order · ${formatPrice(total)}` : `Continue to secure payment · ${formatPrice(total)}`}<ArrowRight size={15} /></button>}
          {config?.demo && !freeOnly && <div className="notice demo" style={{ marginTop: 16 }}><strong>Preview store:</strong> no real payment is collected. Add Stripe keys to accept live card payments right here on the page.</div>}
          <p className="checkout-fineprint" style={{ justifyContent: "center" }}><ShieldCheck size={13} /> Secure checkout · Instant online reading · PDF download</p>

          <h3 className="order-table-title">{items.some((item) => item.name) ? "Items in this order" : "Your order"}</h3>
          <div className="admin-table-wrap"><table className="order-table"><thead><tr><th>Title</th><th>Price excl. tax</th><th>Tax</th><th>Qty</th><th>Total incl. tax</th></tr></thead><tbody>{(quote?.lines || items.map((item) => ({ id: item.id, name: item.name, unitPrice: item.price }))).map((line) => { const lineTax = quote ? Math.round(line.unitPrice * quote.taxRate / 10000) : 0; return <tr key={line.id}><td><Link href={`/products/${items.find((item) => item.id === line.id)?.slug || ""}`}>{line.name}</Link></td><td>{line.unitPrice === 0 ? "Free" : formatPrice(line.unitPrice)}</td><td>{formatPrice(lineTax)}</td><td>1</td><td><strong>{line.unitPrice === 0 ? "Free" : formatPrice(line.unitPrice + lineTax)}</strong></td></tr>; })}</tbody><tfoot>{!!quote?.discount && <tr><td colSpan={4}>Discount {quote.code && `(${quote.code})`}</td><td>-{formatPrice(quote.discount)}</td></tr>}{!!quote?.tax && <tr><td colSpan={4}>Tax</td><td>{formatPrice(quote.tax)}</td></tr>}<tr className="order-table-total"><td colSpan={4}>Final Total</td><td>{total === 0 ? "Free" : formatPrice(total)}</td></tr></tfoot></table></div>
        </div>}
      </div>

      <aside className="summary-card"><h2>Your order</h2>{!ready ? <p className="muted">Loading...</p> : <>{items.map((item) => <div className="cart-item" key={item.id} style={{ gap: 12, padding: "12px 0" }}><div className="cart-item-art" style={{ width: 51, height: 57 }}><ProductArt product={item} /></div><div style={{ flex: 1 }}><div className="cart-item-name" style={{ fontSize: 17 }}>{item.name}</div><div className="cart-item-sub">{item.type === "ebook" ? "E-book" : "Digital journal"} · Read online + PDF</div></div><strong style={{ fontSize: 11 }}>{item.price === 0 ? "Free" : formatPrice(item.price)}</strong></div>)}<div className="summary-line"><span>Subtotal</span><strong>{formatPrice(quote?.subtotal ?? items.reduce((s, i) => s + i.price, 0))}</strong></div>{!!quote?.discount && <div className="summary-line" style={{ color: "#5f8b65" }}><span>Discount</span><strong>-{formatPrice(quote.discount)}</strong></div>}<div className="summary-line"><span>Tax</span><strong>{formatPrice(quote?.tax ?? 0)}</strong></div><div className="summary-line"><span>Delivery</span><strong>Instant</strong></div><div className="summary-line summary-total"><span>Total charge</span><span>{total === 0 ? "Free" : formatPrice(total)}</span></div><div className="summary-note"><LockKeyhole size={13} /> Secure and simple, always.</div></>}</aside>
    </div>
  </div></main>;
}
