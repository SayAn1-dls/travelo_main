# Travelo — Agent Memory

## Problem Statement
Build "Travelo" — a full-stack, production-grade travel ecosystem: plan, book, navigate, and financially manage group trips. Warm, photography-led, travel-native design (terracotta/teal/beige, not corporate). Pillars: Auth (Google/Facebook OAuth + email fallback), Booking engine (flights/trains/hotels, mock data behind BookingProvider abstraction), Stripe payments + webhooks, Destination Hub (local transport + interactive map), AI Travel Assistant (Claude, geolocation-aware), Group Travel Planner (budget, Splitwise-style expense splitting, settlement math, UPI deep links, notifications). All secrets via env vars.

## User Personas & Core Requirements
- Group travellers (India-focused: INR, UPI deep links) booking + splitting expenses mid-trip; mobile-first.
- Non-negotiables: no hardcoded secrets, /api prefix, booking provider abstraction for future real APIs (Amadeus/IRCTC), PCI via Stripe Checkout only.

## User Preferences & Never-Dos
- Auth: Email/password JWT NOW; Google login via Emergent-managed auth (chosen 2026-06, replaces "keys later" plan for Google); Facebook still disabled until user's Meta keys.
- AI: Emergent LLM key with Claude (claude-sonnet-4-6).
- Payments: Stripe claimable sandbox (Flow A) — user chose "Yes, use Stripe test mode".
- Maps: user gave GOOGLE_MAPS_API_KEY "AIzaSyAavrN-VFmqCAoznSTaSEgjuHLkAmguFFc" (labelled demo) — stored in backend/.env; UI uses Leaflet/OSM (reliable, keyless); Google Places can be wired later.
- Notifications: in-app + UPI deep links; EMAIL system built with console provider (logs + db.email_log) — SendGrid activates when user supplies SENDGRID_API_KEY (set EMAIL_PROVIDER=sendgrid).
- Never fabricate/hardcode production API keys.

## Architecture & Tech
- FastAPI + MongoDB (motor) + React 19 (CRA/craco) + shadcn + Tailwind; framer-motion; @phosphor-icons/react (duotone); react-leaflet v5 + OSM tiles.
- Backend modules: server.py (wiring/startup), db.py, models.py, auth.py (JWT+bcrypt, cookies+Bearer, brute-force lockout), providers.py (BookingProvider ABC + MockProvider, deterministic seeded results), destinations_data.py (6 curated hubs: goa, bali, rishikesh, jaipur, manali, kochi), routers_bookings/destinations/trips(+notifications)/chat/payments.
- Auth: access token 12h + refresh 7d; httpOnly cookies AND Authorization Bearer (frontend stores token in localStorage `travelo_token`).
- Trips: members have member_id (uuid), optional user_id link by email; invite_code join; expenses (equal/custom/percentage splits, server-validated); balances = net per member + greedy debt simplification; settlements collection adjusts nets; UPI deep link from creditor user's upi_vpa (profile field).
- Chat: SSE streaming /api/chat/stream, history in db.chat_messages (per user+session; session = "general" or "dest-{slug}"), Nominatim reverse geocode, Claude sonnet-4-6 via emergentintegrations.
- Payments: Stripe sandbox (acct_1Ty43fSQ5IbQI3xl), dynamic price_data in INR, purposes: booking|settlement; webhook /api/stripe/webhook; status poll with Stripe-direct fallback; apply_success idempotent (booking→confirmed / settlement→recorded+notification). Tax: tries automatic_tax, falls back gracefully (_tax_supported flag).
- Design: Playfair Display + DM Sans; palette terracotta #E25822 / teal #0B4F6C / beige #FDFBF7; glass navbar; grain overlay class.
- Google auth: Emergent-managed. POST /api/auth/google/session exchanges #session_id → session_token stored in db.user_sessions (user_id = str of users._id, expires_at ISO +7d) + httpOnly cookie; get_current_user: JWT first, falls back to session lookup on InvalidTokenError. Frontend: AppRoutes hash detection → AuthCallback (useRef guard); AuthContext skips /me when hash has session_id.
- Object storage: storage.py resolves base — tries integrations.emergentagent.com then INTEGRATION_PROXY_URL/objstore (proxy is the working route in this env; direct URL 401s). Uses EMERGENT_LLM_KEY. Soft-delete only.
- Memories: db.memories (photo w/ storage_path | note), endpoints in routers_memories.py; images served via authed GET /api/memories/{id}/image, frontend BlobImage fetches as blob with Bearer.
- Settlement proof: proof_path on settlement doc; upload POST /api/trips/{tid}/settlements/{sid}/proof; view GET /api/settlements/{sid}/proof.
- Email: email_service.send_email → console log + db.email_log (provider from EMAIL_PROVIDER env); remind endpoint emails debtor (works for non-registered members too).

## Implemented (2026-06, testing-agent PASSED 100% backend 23/23 + all frontend flows, iteration_1)
- Full MVP: auth (register/login/me/refresh/profile+UPI), booking search/create/pay flow (Stripe redirect verified), e-ticket page (print→PDF), bookings history, destinations hub w/ Leaflet map + transport tabs + cab deep links, group trips (create/join/members/contributions/expenses equal-custom-percentage/balances/settlements/reminders), in-app notifications w/ UPI Pay Now, Tara chat widget w/ geo consent + SSE streaming (Claude verified), Stripe checkout for bookings + settlements, landing page.
- Destination images swapped to context-matched Unsplash photos for Goa/Bali/Jaipur (HEAD-checked 200).

## Implemented (2026-06 iter 2, testing-agent PASSED 9/9 new + 23/23 regression, iteration_2)
- Google login (Emergent-managed): enabled Google button, AuthCallback hash flow, session tokens coexist with JWT.
- Email reminders: console provider + db.email_log; "you owe ₹X" email with UPI pay button on remind; non-registered members reminded via email too.
- Trip Memories tab: photo uploads (object storage) + notes, delete by creator/organizer, BlobImage authed rendering.
- Payment proof: settle dialog with optional screenshot upload; Proof viewer in settlement history.

## Implemented (2026-06 iter 3, testing-agent PASSED 4/4 new + frontend 100%, iteration_3)
- Trip Chat Context: chat_stream accepts trip_id; build_trip_context injects budget/spend/balances/recent expenses into Tara's system prompt (member-only, fails silently). ChatWidget detects /trips/:id → session `trip-{id}`, budget suggestion chips, "Watching your trip budget" subtitle.
- Memory Slideshow: POST /api/trips/{id}/recap/share → stable share_token on trip; PUBLIC GET /api/recap/{token} (+/image/{memory_id}); RecapPage at public route /recap/:token — auto-advancing slideshow (title → memories → stats), play/pause/dots; "Play recap" + "Share link" banner in Memories tab.
- Spending Alerts: add_expense fires budget_alert notification to ALL registered members exactly when a category budget or budget_total is crossed (no duplicates on later expenses); over-budget category chips styled red with "— over!".

## Implemented (2026-06 iter 4, testing-agent PASSED 11/11 backend + frontend 100%, iteration_4)
- Expense Editing: PUT/DELETE /api/trips/{tid}/expenses/{eid} — creator or organizer only (403 otherwise); edited_at marker; ExpenseDialog reused for edit (key-remount is load-bearing); delete confirm dialog.
- Alert flag map: trips.budget_alerts_fired ({category|__total__: true}) via sync_budget_alerts() on every expense add/edit/delete — fires once per crossing, clears when spend drops under, refires on re-crossing.
- Recap Music & Transitions: Web Audio synthesized ambient chords (createAmbient in RecapPage, no audio asset), music toggle btn; framer-motion AnimatePresence slide transitions keyed by idx.
- Recap Link Revoke: POST /api/trips/{tid}/recap/revoke (organizer-only 403) $unsets share_token; old links 404; re-share issues new token; revoke btn organizer-only in Memories banner.
- Cleaned up TEST_-prefixed trips from testing runs.

## Backlog (P0/P1/P2) & Next Tasks
- P1: Facebook OAuth once user supplies Meta keys; SendGrid activation (set SENDGRID_API_KEY + EMAIL_PROVIDER=sendgrid); push notifications (FCM).
- P2: Google Places live data for Destination Hub; PDF ticket via server-side lib; rate limiting beyond auth lockout; refunds UI; recap token revoke endpoint; budget-alert suppression map if expense edit/delete endpoints are ever added; optional polish from test report: shadcn Calendar for date picker, DialogDescription a11y, explicit CORS origins for production.

## Decision Log
- Bearer token + cookies dual auth → preview proxy cookie quirks can't break auth.
- Leaflet/OSM over Google Maps JS → provided key labelled "demo", would risk broken map; key stored for later.
- Mock booking data deterministic (seeded by route+date) → stable results for testing.
- Stripe INR dynamic price_data (no catalog) → travel amounts are dynamic; amounts always computed server-side (booking doc / balances), never from client.
- Claude model: claude-sonnet-4-6 (playbook recommended for anthropic).

## Dead-Ends (Do NOT Retry)
- Object storage direct URL https://integrations.emergentagent.com/objstore → 401 "Invalid emergent key" in this env; MUST use INTEGRATION_PROXY_URL base (storage.py auto-resolves).

## Gotchas & Learnings
- Stripe sandbox job_id 684e0fee-ea17-479d-b145-bdb964b0ec8b; onboarding_url shared with user for claiming.
- react-leaflet v5 requires React 19 (OK here); default marker icons broken under webpack → custom divIcon pins used.
- FastAPI 422 detail is an array → formatApiError in lib/api.js handles it.
