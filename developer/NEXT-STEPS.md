NEXT STEPS — roadmap, features, tips
====================================
(Update this file whenever priorities change. Log the change in updates/.)

WHAT IS DONE (V1)
-----------------
  [x] Storefront: home, shop, e-books, free, categories, product, cart
  [x] 3-step checkout (details -> payment+review -> start reading)
  [x] Card (Stripe PaymentElement), hosted checkout, preview mode, free items
  [x] Server-side pricing: coupon + tax + total (never trusted from browser)
  [x] Webhook-only fulfillment (browser redirect cannot unlock files)
  [x] Online reader (inline PDF) + free samples (first N pages)
  [x] Secure downloads: signed expiring links, download credits
  [x] Accounts: register/login/reset/verify + guest->account claim
  [x] Admin: products/orders/customers/coupons/content/messages/subscribers
  [x] Admin: navigation, footer, homepage section builder, branding, tax
  [x] Draft -> Preview -> Publish workflow (no redeploy)
  [x] SEO: sitemap, robots, canonical, JSON-LD, OpenGraph
  [x] Responsive from 360px to ultra-wide + reduced-motion support
  [x] config.txt, ADMIN_GUIDE.md, db-setup.sh, this developer/ folder

NEXT STEP (recommended order)
-----------------------------
  1. PRODUCTION PAYMENTS  (highest value, blocked on secrets)
     - Rotate the Neon password, paste new DATABASE_URL into .env.local
       (NOT .env — the host rewrites .env)
     - Stripe: set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET +
       NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, add webhook to /api/webhooks/stripe
     - Test a real low-value purchase end to end, then set ENABLE_DEMO_CHECKOUT=false
  2. EMAIL
     - Resend: verify domain, set RESEND_API_KEY + EMAIL_FROM
     - Confirm: welcome, reset, order receipt, refund, contact auto-reply
  3. STORAGE
     - Cloudflare R2: fill 4 R2_* values, re-upload one PDF to confirm
       (local disk disappears on serverless redeploys)
  4. REAL CONTENT
     - Replace the 8 seeded placeholder classics with real files
     - Replace seeded testimonials/policies/About with your own
     - Create a Neon BRANCH before any schema change (instant backup)
  5. POLISH
     - Add product cover images to every product (visual merchandising)
     - Add 3-5 testimonials and link a real About photo
     - Set NEXT_PUBLIC_SITE_URL after the domain is live (emails + sitemap)

IDEAS FOR THE NEXT FEATURE (pick one, log it)
---------------------------------------------
  A. Product image gallery on the frontend (we store previews; UI shows cover+sample
     only) — small, high visual impact.
  B. Email campaign tool: send newsletter to /api/newsletter subscribers.
  C. Reviews module: table exists (reviews); add "leave a review" for buyers.
  D. Sales reports by date range + CSV export for the admin.
  E. Multi-currency (settings already hold currency per order).
  F. Wishlist + "save for later" using localStorage.
  G. Custom static pages: admin-created /p/[slug] with rich text.
  H. Two-factor login for the admin (highest security gain).

TIPS / GOTCHAS (read before editing)
-------------------------------------
  * .env is REWRITTEN by the host on restart -> put secrets in .env.local.
  * Never print DATABASE_URL / keys. `./scripts/db-setup.sh` never echoes them.
  * Product price 0 = free lead magnet (needs email to unlock).
  * Publishing a product REQUIRES its private PDF (API enforces it).
  * Sample pages are cached per (storageKey, pageCount) -> change sample count
    after replacing a PDF or viewers may see a stale sample.
  * Only the Stripe webhook may mark an order paid; never unlock from the client.
  * getSettings() merges DRAFT only when a signed-in admin has the preview
    cookie — if a customer ever sees draft content, that's a bug: fix immediately.
  * Keep one pg Pool (src/db/index.ts). New Pool() per file = connection exhaustion.
  * Client components must not import src/lib/store or src/db (they pull in pg).
  * formatPrice lives in src/lib/format.ts for that reason — use it in UI code.
  * After ANY code change re-run the validation chain:
      npx next typegen && npx tsc --noEmit && npm run build && build_and_start
  * `drizzle-kit push` in CI needs --force (no TTY); the setup script handles it.
  * Don't mix `push` and `migrate` on one database.
  * Products with existing orders are unpublished, not deleted (buyer access kept).
  * Checkout default mode is DRAFT for settings; publish is always explicit.

WHERE THINGS LIVE (quick answers)
----------------------------------
  Where do I add a menu link?        Content & pages -> Navigation & footer
  Where do I reorder homepage bands? Content & pages -> Homepage sections
  Where is the hero button text?     Content & pages -> Homepage & about
  Where is the tax rate?             Settings -> Brand & contact
  Where do I change colors/logo?     Settings -> Brand & contact
  Where do I upload a PDF?           Products -> edit -> Files & delivery
  Where do I see contact messages?   Messages (in sidebar)
  How do I take money?               config.txt Section 3
