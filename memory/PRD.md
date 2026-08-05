# TRAVELO — PRD & Architecture Memory

## Product
Cinematic dark brutalist travel platform: browse destinations → book packages → pay via Stripe;
group trip planning with expense splitting; AI photo collage maker.

## Stack
- Frontend: React (CRA + craco, `@` alias → src) at /app/frontend, Tailwind, framer-motion, sonner, lucide.
  Fonts: Bebas Neue (display), Space Grotesk (sans), Space Mono (mono), Permanent Marker (marker).
  Colors: ink #030303, blaze #FF4500, acid #EAFF00. Signature utilities in index.css: .text-outline*, .grain-overlay, .shadow-brutal*, .dashed-divider, marquee keyframes.
- Backend: FastAPI /app/backend/server.py (+ destinations_data.py catalog/quotes, setup_stripe.py idempotent catalog sync run at startup thread). Mongo via motor. JWT (PyJWT+bcrypt).
- Stripe: Flow A claimable sandbox (playbook). 24 products × 3 tier prices, lookup_key = "{dest_id}_{tier}". tax_mode="calc_only" (automatic_tax + fallback to plain session). Webhook /api/stripe/webhook. payment_transactions ledger; status poll flips booking → confirmed.
  Onboarding URL shared with user (claimable sandbox acct_1U0gJLSw16MvZHzu).
- LLM: emergentintegrations LlmChat, openai gpt-5.4 vision, EMERGENT_LLM_KEY in backend/.env. /api/collage/analyze returns vibe JSON (falls back to VIBE_FALLBACK with source="fallback" on error).

## Key API routes (all /api prefix)
auth: register/login/me · destinations (region/q filters, 30 total incl. region "India" ×12) · quotes (40)
bookings: POST/GET (+{id}) amount = tier_price(base,tier)×travelers; tiers explorer×1, elite×1.65, legend×2.8
payments: checkout {booking_id,origin_url} → Stripe URL · status/{session_id} · stripe/webhook
trips (planner): CRUD + expenses (equal split) + settle + remind + notifications; finances: pool/spent/remaining/budget over-under, per-member balance = paid − share + settled_out − settled_in, min-cash-flow suggestions
collage/analyze: ≤5 base64 images → {vibe_title, caption, mood, palette[3], hashtags[5], photo_type (friends|couple|solo|family|scenery), scrapbook_labels[3], source}

## Frontend routes
/ (Landing) /auth /explore /destinations/:id /book/:id (protected multi-step → Stripe redirect)
/payment/success (poll) /payment/cancel /dashboard (bookings + pay-now)
/planner /planner/new (wizard: place→squad count generates member+contribution fields→dates→budget→review)
/planner/:id (mission control: budget bar, expenses, ledger, settle PAY via upi://|paypal.me deep link, remind, notifications, hotel/flight/car external links)
/vibe-lab (upload ≤5 → AI vibe → canvas 1080×1920 collage, 5 templates scrapbook/magazine/grid/filmstrip/polaroid; AI photo_type auto-picks themed template (TYPE_THEMES/AUTO_TEMPLATE in VibeLabPage), download + WhatsApp share via Web Share API / wa.me fallback)

## Status
Backend 61/61 tests passing. UI verified via screenshots + browser automation (vibe lab E2E with real AI call).
Test creds: smoke@travelo.app / Test@1234. Stripe TEST mode, card 4242 4242 4242 4242.

## Constraints the user set
- Do NOT change existing UI/design — only additive changes.
- Keep the brutalist cinematic style for all new pages.

## Update log
- v2: fully responsive verified (390px, no overflow); Vibe Lab v2 scrapbook+magazine canvas templates with type-themed auto-edit; 30 destinations (12 India: +agra, rishikesh, manali, jaisalmer, andaman, darjeeling; images curl-verified).
