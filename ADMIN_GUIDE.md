# Softly — Admin Guide

A complete guide to managing your store: inventory, new products, e-books, free
content, orders, emails, content, and going live.

> This same guide is available inside the app (admins only) at **`/admin/guide`**,
> reachable from the "Admin guide" link in the dashboard sidebar.

---

## Getting started
Everything is managed from **`/admin`**. Sign in with your admin account
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`, or the preview login in demo mode).

Sidebar sections:
- **Overview** — revenue, orders, top titles, 7-day sales chart.
- **Products** — full inventory (journals, e-books, free items).
- **Categories · Orders · Customers · Coupons** — day-to-day management.
- **Content & pages** — homepage, About, FAQs, testimonials, policies.
- **Messages · Subscribers** — contact inbox & newsletter list.
- **Settings** — brand, colors, logo, tax rate, integrations.

Saved changes appear on the live site immediately.

---

## Products & inventory management
Open **Products**. Filter with the tabs (All / Journals / E-books / Free items)
and search by title or author.

### Add a new product
1. Click **Add product**.
2. Enter **name** (slug auto-fills), **subtitle**, **description**.
3. Choose **Product type**: *Journal / printable* or *E-book* (add **Author** for e-books).
4. Set **Price** (enter **0** for a free item); optional lower **sale price**.
5. Pick a **cover style** or upload a **cover image** (JPG/PNG/WebP).
6. Upload the **private PDF** — the actual file customers receive (stored privately).
7. Set **free sample pages** (e.g. 3) for a public preview.
8. Set **max downloads** and **guest link expiry (days)**.
9. Add **tags**, **what's included**, optional **SEO** fields.
10. Set status to **Published** and save. *(A private PDF is required to publish.)*

### Edit / unpublish / delete
- **Pencil** = edit, **Trash** = remove.
- Products with existing orders are **unpublished** instead of deleted (past buyers keep access).
- Set to **Draft** to hide without deleting.

---

## Adding e-books
E-books show on **`/ebooks`** and the homepage "Reading Room" shelf.
1. Add a product with **Type = E-book**.
2. Fill in the **Author** (shows on cover, cards, product page).
3. Upload the book PDF; set a **sample page** count to drive interest.
4. Mark **Featured** / **Bestseller** to spotlight it.

Replace the seeded placeholder classics with your real files by editing each and
uploading a new PDF.

---

## Free items & free samples (grow traffic)
- **Free items** — set price to **0**. Delivered instantly for name + email
  (lead magnet). Shown on **`/free`**.
- **Free samples** — set **sample pages** on any paid product; anyone can read the
  first pages in-browser, no email needed.

Opt-in emails are added to **Subscribers** automatically.

---

## Categories
**Categories → Add category**: name (slug auto-fills), description, color palette,
sort order. Assign products to a category in the product editor.

---

## Orders, downloads & refunds
- **Orders** lists every purchase with payment/order status and totals; search by
  order number, name, or email.
- **Eye** icon = full details (line items, tax, coupon, provider, transaction ID).
- **Refund** a paid order — revokes access and issues the Stripe refund; sends a
  refund email if configured.
- **Cancel** is available for pending (unpaid) orders.

Paid orders unlock only after Stripe's verified webhook.

---

## Customers
**Customers** shows order count, total spent, and history per account.
**Disable**/**reactivate** accounts as needed. Admin accounts are protected.

---

## Coupons & offers
**Coupons → Create coupon**: code, percentage or fixed discount, optional minimum
spend, usage limit, expiry, and active toggle. Discounts recalculated server-side.
Seeded code: **WELCOME15** (15% off).

---

## Content & pages
**Content & pages** tabs:
- **Homepage & about** — announcement bar, hero (headline/description/image),
  featured heading, story text/image, About copy (image uploads supported).
- **FAQs** — add/edit/reorder/show-hide.
- **Testimonials** — homepage quotes.
- **Policies** — Privacy, Terms, Refund text.

> Have a professional review legal policies before production.

---

## Managing emails
### Contact-form inbox
Contact-page messages appear under **Messages**. Open to read (auto-marked read);
use **Reply by email** to respond from your mail app.

### Automatic (transactional) emails
When email is configured, the store sends: welcome & verification, password reset,
order confirmation with secure link, refund confirmation, and contact
acknowledgement (+ a copy to your support inbox).

### Turn emails on
1. Create a **Resend** account; verify your sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (see `.env.example`).
3. Set your **Support email** under **Settings → Brand & contact**.

Without email, orders still work — customers use the secure link on the
confirmation page; emails simply aren't sent.

---

## Newsletter subscribers
**Subscribers** lists everyone who joined via the newsletter or opt-in flows, with
email and join date. Keep marketing separate from transactional email.

---

## Settings & branding
**Settings → Brand & contact**: brand name, tagline, logo & favicon, primary &
accent colors (restyle the whole site), support email, social links, and
**sales tax / VAT rate** (applied to discounted subtotal; 0 if handled elsewhere).
The **Integrations** panel shows Stripe / email / storage status.

---

## Going live (accept real payments)
1. Create a **Stripe** account; get your keys.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Add a Stripe webhook to `/api/webhooks/stripe` with the events in `.env.example`.
4. Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` (disables preview admin), a stable
   `DOWNLOAD_SECRET`, and `SITE_URL`.
5. Configure **Resend** email and **Cloudflare R2** storage.
6. Replace placeholder products/policies; test a live purchase.

Full variable reference: **`.env.example`**.

---

## Security good-to-knows
- PDFs are stored privately and delivered via signed, expiring links.
- Prices, taxes, discounts are recomputed server-side.
- Orders unlock only after Stripe's verified webhook.
- Keep `ADMIN_PASSWORD` and all keys secret; never commit `.env`.

---

## Troubleshooting
- **Can't publish?** Upload the private PDF first.
- **Emails not sending?** Check `RESEND_API_KEY`, verified domain, `EMAIL_FROM`.
- **Payment not configured?** Set all three Stripe keys + webhook.
- **Uploads vanish after redeploy?** Configure R2 (local disk isn't persistent on serverless).
- **Customer lost their link?** They sign in with the purchase email and claim the
  order, or you look it up under Orders.
