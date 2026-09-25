import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, BookOpen, Gift, Grid2X2, ReceiptText, Users, TicketPercent, PanelsTopLeft, Mail, Send, Settings, ShieldCheck, LifeBuoy, Rocket } from "lucide-react";
import { getAdmin, isDemoMode } from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";

export const metadata: Metadata = { title: "Admin Guide | Softly Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminGuidePage() {
  await ensureSeeded();
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const demo = isDemoMode();

  return (
    <main className="guide-page">
      <div className="guide-wrap">
        <Link href="/admin" className="text-link" style={{ marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <header className="guide-header">
          <span className="eyebrow">SOFTLY STUDIO · ADMIN ONLY</span>
          <h1>How to run your store</h1>
          <p>
            A friendly, complete guide to managing your full inventory, adding new products,
            handling emails, orders, content, and going live. This page is visible only to
            signed-in admins.
          </p>
          {demo && (
            <div className="notice demo" style={{ marginTop: 18 }}>
              <strong>You&apos;re in Preview mode.</strong> No real payments are collected yet.
              See <a href="#golive" style={{ textDecoration: "underline" }}>Going live</a> to accept real orders.
            </div>
          )}
        </header>

        {/* Quick contents */}
        <nav className="guide-toc" aria-label="Guide contents">
          {[
            ["getting-started", "Getting started"],
            ["products", "Products & inventory"],
            ["ebooks", "Adding e-books"],
            ["free", "Free items & samples"],
            ["categories", "Categories"],
            ["orders", "Orders & refunds"],
            ["customers", "Customers"],
            ["coupons", "Coupons"],
            ["content", "Content & pages"],
            ["emails", "Emails"],
            ["subscribers", "Subscribers"],
            ["settings", "Settings & branding"],
            ["golive", "Going live"],
            ["security", "Security"],
            ["troubleshooting", "Troubleshooting"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>

        <Section id="getting-started" icon={Rocket} title="Getting started">
          <p>Everything is managed from <strong>/admin</strong>. The left sidebar has every section:</p>
          <ul>
            <li><strong>Overview</strong> — revenue, orders, top titles, and a 7-day sales chart.</li>
            <li><strong>Products</strong> — your full inventory (journals, e-books, free items).</li>
            <li><strong>Categories, Orders, Customers, Coupons</strong> — day-to-day management.</li>
            <li><strong>Content &amp; pages</strong> — homepage text, About, FAQs, testimonials, policies.</li>
            <li><strong>Messages &amp; Subscribers</strong> — contact-form inbox and newsletter list.</li>
            <li><strong>Settings</strong> — brand, colors, logo, tax rate, and integration status.</li>
          </ul>
          <p className="guide-tip">Tip: Changes you save appear on the live site immediately — no redeploy needed.</p>
        </Section>

        <Section id="products" icon={Package} title="Products & inventory management">
          <p>Open <strong>Products</strong> in the sidebar. Use the tabs (All / Journals / E-books / Free items) and the search box to find anything by title or author.</p>
          <h3>Add a new product</h3>
          <ol>
            <li>Click <strong>“Add product”</strong> (top-right).</li>
            <li>Enter the <strong>name</strong> (the URL slug auto-fills), a <strong>subtitle</strong>, and a <strong>description</strong>.</li>
            <li>Pick a <strong>Product type</strong>: <em>Journal / printable</em> or <em>E-book</em>. For e-books, add the <strong>Author</strong>.</li>
            <li>Set the <strong>Price</strong>. Enter <strong>0</strong> to make it a free item. Optionally add a lower <strong>sale price</strong>.</li>
            <li>Choose a <strong>cover style</strong> (auto-generated art) or upload a <strong>cover image</strong> (JPG/PNG/WebP).</li>
            <li>Upload the <strong>private PDF</strong> — this is the actual file customers receive. It is stored privately and never linked publicly.</li>
            <li>Set <strong>free sample pages</strong> (e.g. 3) so visitors can preview the first pages for free.</li>
            <li>Set <strong>max downloads</strong> and <strong>guest link expiry (days)</strong>.</li>
            <li>Add <strong>tags</strong>, <strong>what&apos;s included</strong>, and optional <strong>SEO title/description</strong>.</li>
            <li>Set status to <strong>Published</strong> and save. (A private PDF is required before publishing.)</li>
          </ol>
          <h3>Edit / unpublish / delete</h3>
          <ul>
            <li>Click the <strong>pencil</strong> icon to edit any product; the <strong>trash</strong> icon to remove it.</li>
            <li>Products that already have orders are <strong>unpublished</strong> (hidden) instead of deleted, so past customers keep access.</li>
            <li>Set a product back to <strong>Draft</strong> any time to hide it without deleting.</li>
          </ul>
          <p className="guide-tip">The “PDF · Sample” column shows whether a file is uploaded and how many free sample pages are set.</p>
        </Section>

        <Section id="ebooks" icon={BookOpen} title="Adding e-books (famous books, new titles)">
          <p>E-books appear on the dedicated <strong>/ebooks</strong> page and in the homepage “Reading Room” shelf.</p>
          <ol>
            <li>Add a product and set <strong>Type = E-book</strong>.</li>
            <li>Fill in the <strong>Author</strong> — it shows on the cover, cards, and product page.</li>
            <li>Upload the book PDF and set a sensible <strong>sample page</strong> count to drive interest.</li>
            <li>Mark it <strong>Featured</strong> and/or <strong>Bestseller</strong> to spotlight it on the homepage and the “Reader favourite” banner.</li>
          </ol>
          <p className="guide-tip">Replace the seeded placeholder classics (Pride and Prejudice, Meditations, etc.) with your own real files by editing each and uploading a new PDF.</p>
        </Section>

        <Section id="free" icon={Gift} title="Free items & free samples (grow traffic)">
          <p>Two engagement tools are built in:</p>
          <ul>
            <li><strong>Free items</strong> — set price to <strong>0</strong>. Visitors get them instantly by entering name + email (a great lead magnet). They appear on the <strong>/free</strong> page.</li>
            <li><strong>Free samples</strong> — set <strong>sample pages</strong> on any paid product. Anyone can read the first pages in the browser via the “Read a free sample” button — no email needed.</li>
          </ul>
          <p>Every free email capture is added to <strong>Subscribers</strong> automatically (when the customer opts in).</p>
        </Section>

        <Section id="categories" icon={Grid2X2} title="Categories">
          <p>Under <strong>Categories</strong>, click “Add category”. Give it a name (slug auto-fills), a short description, a color palette, and a sort order. Assign products to a category from the product editor. Journals are grouped by category on the storefront; e-books have their own shelf.</p>
        </Section>

        <Section id="orders" icon={ReceiptText} title="Orders, downloads & refunds">
          <ul>
            <li>Open <strong>Orders</strong> to see every purchase with payment status, order status, and totals. Search by order number, name, or email.</li>
            <li>Click the <strong>eye</strong> icon to view line items, tax, coupon used, provider, and transaction ID.</li>
            <li><strong>Refund</strong> a paid order from its details — this revokes download access and, for Stripe orders, issues the refund automatically. A refund email is sent if email is configured.</li>
            <li><strong>Cancel</strong> is available for pending (unpaid) orders.</li>
          </ul>
          <p className="guide-tip">Paid orders are fulfilled only after Stripe confirms payment via webhook — so the numbers you see are trustworthy.</p>
        </Section>

        <Section id="customers" icon={Users} title="Customers">
          <p>Under <strong>Customers</strong>, view each account&apos;s order count, total spent, and purchase history. You can <strong>disable</strong> a misbehaving account or <strong>reactivate</strong> it later. Admin accounts can&apos;t be changed here for safety.</p>
        </Section>

        <Section id="coupons" icon={TicketPercent} title="Coupons & offers">
          <ol>
            <li>Go to <strong>Coupons</strong> → “Create coupon”.</li>
            <li>Choose a <strong>code</strong>, a <strong>percentage</strong> or <strong>fixed</strong> discount, optional <strong>minimum spend</strong>, <strong>usage limit</strong>, and <strong>expiry date</strong>.</li>
            <li>Toggle <strong>Active</strong> on/off any time.</li>
          </ol>
          <p>Discounts are always recalculated on the server at checkout, so codes can&apos;t be tampered with. The seeded <strong>WELCOME15</strong> code gives 15% off.</p>
        </Section>

        <Section id="content" icon={PanelsTopLeft} title="Content & pages (homepage, About, FAQs, policies)">
          <p>Open <strong>Content &amp; pages</strong>. Tabs let you edit:</p>
          <ul>
            <li><strong>Homepage &amp; about</strong> — announcement bar, hero headline/description/image, featured heading, story text/image, and the About page copy. You can upload hero and story images here.</li>
            <li><strong>FAQs</strong> — add, edit, reorder, and show/hide questions.</li>
            <li><strong>Testimonials</strong> — customer quotes shown on the homepage.</li>
            <li><strong>Policies</strong> — Privacy, Terms, and Refund page text.</li>
          </ul>
          <p className="guide-warn">Have a professional review your legal policies before selling in production.</p>
        </Section>

        <Section id="emails" icon={Mail} title="Managing emails">
          <h3>Contact-form inbox</h3>
          <p>Messages from your <strong>Contact</strong> page arrive under <strong>Messages</strong>. Open one to read it (it&apos;s marked read automatically) and use <strong>“Reply by email”</strong> to respond from your own mail app.</p>
          <h3>Automatic (transactional) emails</h3>
          <p>Once email is configured (see below), the store automatically sends:</p>
          <ul>
            <li>Welcome &amp; email verification</li>
            <li>Password reset links</li>
            <li>Order confirmation with secure download/reading link</li>
            <li>Refund confirmation</li>
            <li>Contact-form acknowledgement (to the customer) + a copy to your support inbox</li>
          </ul>
          <h3>Turn emails on</h3>
          <ol>
            <li>Create a <strong>Resend</strong> account and verify your sending domain.</li>
            <li>Set <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> in your environment (see <code>.env.example</code>).</li>
            <li>Set your public <strong>Support email</strong> under <strong>Settings → Brand &amp; contact</strong>; support copies go there.</li>
          </ol>
          <p className="guide-tip">Without email configured, orders still work — customers see and use the secure link on the confirmation page. Emails simply aren&apos;t sent.</p>
        </Section>

        <Section id="subscribers" icon={Send} title="Newsletter subscribers">
          <p>Everyone who joins your newsletter or opts in during a free/checkout flow appears under <strong>Subscribers</strong> with their email and join date. Export or use these in your email tool for marketing (keep marketing separate from transactional emails).</p>
        </Section>

        <Section id="settings" icon={Settings} title="Settings & branding">
          <p>Under <strong>Settings → Brand &amp; contact</strong> you can set:</p>
          <ul>
            <li><strong>Brand name</strong>, <strong>tagline</strong>, <strong>logo</strong> and <strong>favicon</strong> (upload or URL).</li>
            <li><strong>Primary</strong> and <strong>accent colors</strong> — they restyle the whole storefront.</li>
            <li><strong>Support email</strong> and social links.</li>
            <li><strong>Sales tax / VAT rate</strong> — applied to the discounted subtotal at checkout (leave 0 if your provider handles tax).</li>
          </ul>
          <p>The <strong>Integrations</strong> panel shows, at a glance, whether Stripe, email, and private storage are connected.</p>
        </Section>

        <Section id="golive" icon={Rocket} title="Going live (accept real payments)">
          <ol>
            <li>Create a <strong>Stripe</strong> account and get your keys.</li>
            <li>Set <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>, and <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.</li>
            <li>Add a webhook in Stripe pointing to <code>/api/webhooks/stripe</code> and enable the events listed in <code>.env.example</code>.</li>
            <li>Set <code>ADMIN_EMAIL</code> + <code>ADMIN_PASSWORD</code> (this disables the preview admin), a stable <code>DOWNLOAD_SECRET</code>, and <code>SITE_URL</code>.</li>
            <li>Configure <strong>Resend</strong> email and <strong>Cloudflare R2</strong> storage for production.</li>
            <li>Replace placeholder products/policies with your real content, then test a live purchase.</li>
          </ol>
          <p className="guide-tip">Full variable reference lives in <code>.env.example</code> at the project root.</p>
        </Section>

        <Section id="security" icon={ShieldCheck} title="Security good-to-knows">
          <ul>
            <li>Product PDFs are stored privately and delivered via short-lived, signed links — never public URLs.</li>
            <li>Prices, taxes, and discounts are always recomputed on the server; the browser can&apos;t change them.</li>
            <li>Orders unlock only after Stripe&apos;s verified webhook — not from a browser redirect.</li>
            <li>Keep <code>ADMIN_PASSWORD</code> and all keys secret; never commit your <code>.env</code>.</li>
          </ul>
        </Section>

        <Section id="troubleshooting" icon={LifeBuoy} title="Troubleshooting">
          <ul>
            <li><strong>Can&apos;t publish a product?</strong> Upload its private PDF first.</li>
            <li><strong>Emails not sending?</strong> Check <code>RESEND_API_KEY</code>, verified domain, and <code>EMAIL_FROM</code>.</li>
            <li><strong>Payment says not configured?</strong> Set all three Stripe keys and the webhook.</li>
            <li><strong>Uploads vanish after redeploy?</strong> Configure R2 storage — local disk isn&apos;t persistent on serverless hosts.</li>
            <li><strong>A customer lost their link?</strong> They can sign in with the purchase email and claim the order, or you can look it up under Orders.</li>
          </ul>
        </Section>

        <footer className="guide-footer">
          <p>That&apos;s everything. You can always return here from the sidebar link in the dashboard.</p>
          <Link href="/admin" className="button">Back to dashboard</Link>
        </footer>
      </div>
    </main>
  );
}

function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ComponentType<{ size?: number }>; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="guide-section">
      <h2><span className="guide-section-icon"><Icon size={18} /></span>{title}</h2>
      <div className="guide-body">{children}</div>
    </section>
  );
}
