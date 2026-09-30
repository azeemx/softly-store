ARCHITECTURE — file by file (89 source files)
=============================================
Stack: Next.js 16 App Router + TypeScript + Tailwind v4 + PostgreSQL/Drizzle
      + Stripe + Cloudflare R2/S3 + Resend.
Rule of thumb: CLIENT components ("use client") handle interaction; everything
money- or data-sensitive runs SERVER-side in route handlers.

ROOT CONFIG
-----------
  package.json            deps + scripts (never edit by hand; use install tool)
  tsconfig.json           path alias @/* -> ./src/*
  next.config.ts          Next config
  drizzle.config.ts       Loads .env via dotenv; reads DATABASE_URL from env —
                          so `npx drizzle-kit push` needs NO flags.
  eslint.config.mjs       lint rules
  .env / .env.local       secrets (gitignored). .env = DATABASE_URL only (the
                          host rewrites it), .env.local = everything else.
  .env.example            secret-free template
  .gitignore              ignores .env*, .next, node_modules, private uploads
  config.txt              every env var: what/where-to-get/ProTip
  README.md               project overview + setup
  ADMIN_GUIDE.md          markdown copy of the in-app admin guide
  scripts/db-setup.sh     connect -> drizzle push -> verify tables (no URL echo)

src/db
------
  schema.ts               ALL tables: users, sessions, auth_tokens, categories,
                          products (type=journal|ebook, author), product_images,
                          digital_files (previewPages!), orders, order_items,
                          payments, coupons, coupon_usages, site_settings (brand,
                          nav jsonb, footer jsonb, homepageSections jsonb, draft),
                          faqs, testimonials, contact_messages, newsletter_subscribers,
                          reviews, audit_logs.
  index.ts                single shared pg Pool -> drizzle client (never make a 2nd pool)

src/lib (server logic)
----------------------
  auth.ts     password scrypt hashing, session cookies, getAdmin() guard,
              accessKeyForOrder() (signed download keys), rate limiting,
              isDemoMode() (preview checkout toggle)
  admin.ts    slugify + validation parsers for product/category/coupon + audit()
  checkout.ts priceCart() — THE price source of truth: lines, coupon, tax, total
  payments.ts getCouponDiscount(), fulfillOrder() (idempotent, sends email),
              markOrderFailed()
  storage.ts  private file IO: PDF write/read (R2 or local disk), sample PDF
              generators, buildPreviewPdf() (cuts first N pages with pdf-lib)
  access.ts   resolvePurchasedItem() — one place that authorizes read/download
  email.ts    Resend fetch + HTML layout helper
  store.ts    DB queries: getSettings() (merges DRAFT when admin previews),
              getPublishedProducts(filters), product/category/FAQ/testimonial
              getters, DEFAULT_NAV/FOOTER/SECTIONS, first-run seeding
  format.ts   formatPrice/formatDate — browser-safe (no DB import!)

src/components (UI)
-------------------
  CartProvider.tsx     localStorage cart + server re-quote (/api/cart/quote)
  Header.tsx           sticky nav, mobile drawer, search (links come from DB)
  Footer.tsx           footer columns come from DB
  ProductArt.tsx       generated vector book/journal cover (theme by color)
  ProductCard.tsx      card w/ Free badge + quick add
  AddToCartButton.tsx  add / buy-now buttons
  ProductGallery.tsx   client gallery: cover + sample page + uploaded previews
  FAQAccordion.tsx     home/FAQ accordion
  Newsletter.tsx       newsletter form
  AuthForm.tsx         login/register/forgot/reset/verify (+admin variant)
  CheckoutSteps.tsx    1 Details -> 2 Payment -> 3 Start Reading chevrons
  CheckoutClient.tsx   the 3-step checkout: quote, coupon, method picker,
                       Stripe PaymentElement, order review table w/ tax
  OrderStatusPoller.tsx polls receipt while webhook confirms payment
  ClearCartOnSuccess.tsx removes ONLY the purchased items from this browser's bag
  ClaimGuestOrder.tsx  guest -> account: proves receipt key + email match
  FreeClaimForm.tsx    free product: name+email -> instant delivery (lead magnet)
  ContactForm.tsx      contact page form
  ReaderShell.tsx      full-screen reader: themes, fullscreen, open/download
  PreviewBar.tsx       floating bar while admin previews a draft
  admin/AdminApp.tsx   the whole dashboard (tabs, tables, modals, publish bar)
  admin/Editors.tsx    product editor, generic editor (cat/coupon/faq/testimonial),
                       settings editor (home/brand/policies)
  admin/SiteEditors.tsx nav+footer editor, homepage sections builder
  admin/types.ts       typed shapes of /api/admin/data responses

src/app — public storefront under (store)/
------------------------------------------
  layout.tsx      reads settings, injects CSS vars (--forest/--accent), passes
                  DB nav+footer, renders PreviewBar for admins
  page.tsx        HOME: hero (admin text+buttons) + benefits + SECTION BUILDER
                  order + newsletter
  shop/page.tsx   journals grid w/ search, sort, sale filter, category pills
  ebooks/page.tsx e-books shelf + featured book + search/sort/free filter
  free/page.tsx   free library + sample callout + newsletter
  categories/[slug]page.tsx  category listing
  products/[slug]/page.tsx   detail: gallery, author, free-sample button,
                             FreeClaimForm, JSON-LD structured data, related
  cart/page.tsx             bag (server-quoted prices)
  checkout/page.tsx         step 1/2 wrapper (server passes user identity)
  checkout/success/page.tsx step 3: Read now + Download + claim + tax receipt
  checkout/failed/page.tsx  soft failure page
  account/*                 login/register/forgot/reset/verify + library/orders
  about, contact, faq, policies/[slug]   content pages (admin-editable text)
  not-found.tsx             404

src/app/admin — operator UI
---------------------------
  page.tsx        server guard: non-admin -> redirect /admin/login; renders AdminApp
  login/page.tsx  separate login (demo creds hidden once ADMIN_* set)
  guide/page.tsx  the admin guide (admin-only, 307 for anon)

src/app/api — server endpoints (all authorize server-side)
----------------------------------------------------------
  health                          DB ping
  auth/[action]                   login/register/logout/forgot/reset/verify
  cart/quote                      re-price a saved bag (anti-tamper)
  checkout                        POST create order + card/hosted/preview flow,
                                  GET returns payment capability to the UI
  checkout/[id]                   PATCH apply coupon to a pending card order
  webhooks/stripe                 signature-verified fulfillment (webhook is the
                                  ONLY thing that unlocks paid orders)
  coupons/validate                full price quote (lines, tax, total)
  download/[id]                   gated PDF, enforces download credits
  read/[id]                       gated PDF streamed INLINE (reading never spends
                                  a download credit)
  preview/[slug]                  public free sample = first N pages only
  media/[name]                    serves uploaded images (R2/local)
  contact, newsletter             inbox + list capture
  account/claim-order             guest -> account claim (receipt key check)
  admin/data                      everything the dashboard needs
  admin/[resource]                CREATE + settings PUT (draft/publish/discard)
  admin/[resource]/[id]           PATCH/DELETE incl. refund/cancel, previewPages
  admin/upload                    validated image/PDF upload (magic bytes, size)
  admin/images/[id]               delete preview image
  admin/preview                   toggles the admin-only preview cookie

public/
-------
  images/hero-journal.jpg         generated hero photo
  images/story-journal.jpg        generated about photo
  logo.svg, favicon.svg           brand marks

runtime-only (gitignored)
-------------------------
  private_uploads/                private PDFs (never publicly linked)
  media_uploads/                  uploaded images served via /api/media
  .next/, node_modules/
