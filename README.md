# Softly — Digital Journal Store

> **Setup first?** Read **`config.txt`** — it explains every `.env` variable: what it
> is, where to get it, and a ProTip per step. Then run `./scripts/db-setup.sh`
> (connectivity check + `drizzle-kit push` + table verification, URL never printed).
> Admin login lives in `.env` as `ADMIN_EMAIL` / `ADMIN_PASSWORD`.


A full-stack digital journal storefront and admin studio built with Next.js App Router, TypeScript, PostgreSQL/Drizzle, Stripe Checkout, and optional Cloudflare R2/S3-compatible storage and Resend email.

## Preview mode

With no `STRIPE_SECRET_KEY`, the store runs in clearly labeled **preview checkout** mode: no card is charged, but orders, coupons, entitlements, and guarded PDF downloads work end to end. The seeded admin login is `hello@softly.studio` / `SoftlyDemo2026!` **only in preview mode when neither `ADMIN_EMAIL` nor `ADMIN_PASSWORD` is set**. Set both variables together for a private admin account. Eight example journals include generated multi-page PDF files. Replace these with your own PDFs before launching.

## Production setup

Set these server-side environment variables in your deployment:

- `DATABASE_URL` — PostgreSQL connection string.
- `SITE_URL` (or `NEXT_PUBLIC_SITE_URL`) — canonical HTTPS origin, used in email links, Stripe redirects, and SEO.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — both required before live checkout will process a payment. Add a Stripe webhook pointing to `https://your-domain.com/api/webhooks/stripe`. Listen for `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `charge.refunded`.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — enables the on-page card form (Stripe Payment Element: cards, Apple Pay, Google Pay, Link). Card numbers go directly to Stripe and never touch this server. Without it, customers are offered Stripe's hosted page ("More payment options") instead.

## Checkout & reading flow

1. **Your details** — name, email, optional country, newsletter opt-in (guest checkout supported).
2. **Payment & Review** — choose credit/debit card (embedded), more payment options (Stripe hosted page), or preview payment in demo mode; apply a coupon; review the itemised table with tax and final total; click **Process Order**.
3. **Start Reading** — read each item instantly in the online reader (`/read/[item]`) or download the PDF. Reading never consumes download credits.

Free items (price `$0`) skip payment: visitors enter name + email and are taken straight to the reader — a built-in lead magnet. Every title also offers a **free sample** (`/read/sample/[slug]`) that serves only the first N pages (set per product in the admin panel). E-books live at `/ebooks` and free content at `/free`; the seeded classics are placeholder editions — upload real files from **Admin → Products**.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` — initial private admin login. Existing seeded preview credentials are rotated or disabled when production payment credentials are added.
- `DOWNLOAD_SECRET` — long random server secret for deriving expiring order access links. Keep it stable, or existing guest links will stop working. If omitted, the server derives this from `STRIPE_SECRET_KEY` or `DATABASE_URL`.
- `RESEND_API_KEY` and `EMAIL_FROM` — transactional email sending. Verify your sender domain in Resend. Without these, receipts remain accessible on the success page, but emails and password-reset delivery are unavailable.
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` — private S3-compatible object storage for new PDF and image uploads. Without these, uploads use local disk, which is suitable only for a persistent single-server preview, not ephemeral serverless hosting.

Optionally set `ENABLE_DEMO_CHECKOUT=false` to disable preview purchases before payment is configured. Currency is USD in this V1.

## Database

The schema lives in `src/db/schema.ts`. Apply it with `npx drizzle-kit push`. Catalog, sample files, FAQ entries, a welcome coupon, and preview admin access are seeded on the first storefront request; existing admin-uploaded files are not overwritten.

## Security model

Saved carts refresh current product prices and availability from the server; checkout recalculates every price and coupon discount in PostgreSQL. Guests can later claim a paid order in their account only by presenting the unexpired secure receipt link while signed in with the purchase email. Stripe payment is fulfilled **only** from a cryptographically verified webhook; browser redirects never unlock paid files. PDFs are stored outside `public/` (or in a private R2 bucket). Download requests require an authenticated purchase or a high-entropy expiring order link and enforce download limits. Admin routes authorize the user role on the server. Uploaded file signatures and sizes are validated. Passwords use salted scrypt hashes, and sessions use HttpOnly cookies.

Before production, replace example PDF content and starter policy text with your own, set up database backups, configure a real email sender and storage bucket, test Stripe in sandbox, and review legal/tax requirements for your location.
