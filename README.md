Softly — Digital Journal Store

Setup first: Read config.txt — it explains every .env variable, including what it is, where to get it, and a ProTip for each step. Then run ./scripts/db-setup.sh to perform the connectivity check, drizzle-kit push, and table verification. The database URL is never printed.

Admin login is configured through .env using ADMIN_EMAIL / ADMIN_PASSWORD.

A full-stack digital journal storefront and admin studio built with Next.js App Router, TypeScript, PostgreSQL/Drizzle, Stripe Checkout, and optional Cloudflare R2/S3-compatible storage and Resend email.

Preview mode

With no STRIPE_SECRET_KEY, the store runs in clearly labeled preview checkout mode. No card is charged, but orders, coupons, entitlements, and guarded PDF downloads work end to end.

The seeded admin login is:

Email: hello@softly.studio

Password: SoftlyDemo2026!

These credentials are available only in preview mode when neither ADMIN_EMAIL nor ADMIN_PASSWORD is set. Set both variables together to use a private admin account.

Eight example journals include generated multi-page PDF files. Replace these with your own PDFs before launching.

Production setup

Set these server-side environment variables in your deployment:

DATABASE_URL — PostgreSQL connection string.

SITE_URL (or NEXT_PUBLIC_SITE_URL) — canonical HTTPS origin used in email links, Stripe redirects, and SEO.

STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET — both are required before live checkout will process payments. Add a Stripe webhook pointing to https://your-domain.com/api/webhooks/stripe.

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — enables the on-page Stripe Payment Element with cards, Apple Pay, Google Pay, and Link. Card numbers go directly to Stripe and never touch this server. Without it, customers are offered Stripe's hosted payment page ("More payment options").

ADMIN_EMAIL and ADMIN_PASSWORD — private admin credentials.

DOWNLOAD_SECRET — a long random server secret used to derive expiring order-access links. Keep it stable or existing guest links will stop working. If omitted, the server derives it from STRIPE_SECRET_KEY or DATABASE_URL.

RESEND_API_KEY and EMAIL_FROM — transactional email sending. Verify your sender domain in Resend. Without these, receipts remain available on the success page, but emails and password-reset delivery are unavailable.

R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET — private S3-compatible object storage for new PDF and image uploads. Without these, uploads use local disk, which is suitable only for a persistent single-server preview and not ephemeral serverless hosting.

ENABLE_DEMO_CHECKOUT=false — optionally disables preview purchases before live payment is configured.

Currency is USD in this V1.

Stripe webhook events

Configure the Stripe webhook at:

https://your-domain.com/api/webhooks/stripe

Listen for:

payment_intent.succeeded

payment_intent.payment_failed

checkout.session.completed

checkout.session.async_payment_succeeded

checkout.session.async_payment_failed

charge.refunded

Checkout & reading flow

Your details — name, email, optional country, and newsletter opt-in. Guest checkout is supported.

Payment & Review — choose credit/debit card through the embedded Stripe Payment Element, use Stripe's hosted page for additional payment options, or use preview payment in demo mode. Apply a coupon, review the itemized table with tax and final total, then click Process Order.

Start Reading — read each purchased item instantly in the online reader at /read/[item] or download its PDF. Reading never consumes download credits.

Free content and samples

Free items with a price of $0 skip payment. Visitors enter their name and email and are taken directly to the reader, providing a built-in lead magnet.

Every title also offers a free sample at:

/read/sample/[slug]

Samples serve only the first N pages, configured per product in the admin panel.

E-books are available at /ebooks, while free content is available at /free.

The seeded classics are placeholder editions. Upload the real files through Admin → Products before launch.

Database

The database schema lives in:

src/db/schema.ts

Apply the schema with:

npx drizzle-kit push

The first storefront request seeds:

Catalog products

Sample files

FAQ entries

A welcome coupon

Preview admin access

Existing admin-uploaded files are not overwritten.

Security model

The application is designed so that payment and file access cannot be granted solely by manipulating browser state.

Saved carts refresh current product prices and availability from the server.

Checkout recalculates every price and coupon discount in PostgreSQL.

Guests can later claim a paid order in their account only by presenting the unexpired secure receipt link while signed in with the purchase email.

Stripe payment fulfillment occurs only through a cryptographically verified webhook.

Browser redirects never unlock paid files.

PDFs are stored outside public/ or inside a private R2 bucket.

Download requests require an authenticated purchase or a high-entropy expiring order link.

Download limits are enforced server-side.

Admin routes authorize the user role on the server.

Uploaded file signatures and sizes are validated.

Passwords use salted scrypt hashes.

Sessions use HttpOnly cookies.

Before production

Before launching:

Replace all example PDF content with your actual journal files.

Replace starter policy text with your own legal/policy content.

Set up database backups.

Configure a verified transactional email sender.

Configure private object storage for production deployments.

Test Stripe thoroughly in sandbox mode.

Verify webhook delivery and fulfillment behavior.

Set private ADMIN_EMAIL and ADMIN_PASSWORD credentials.

Keep DOWNLOAD_SECRET stable after launch.

Review applicable legal and tax requirements for your location.