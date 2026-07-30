# Travelo — Agent Memory

## Problem Statement
Build "Travelo" — a full-stack, production-grade travel ecosystem: plan, book, navigate, and financially manage group trips. Warm, photography-led, travel-native design (terracotta/teal/beige, not corporate). Pillars: Auth (Google/Facebook OAuth + email fallback), Booking engine (flights/trains/hotels, mock data behind BookingProvider abstraction), Stripe payments + webhooks, Destination Hub (local transport + interactive map), AI Travel Assistant (Claude, geolocation-aware), Group Travel Planner (budget, Splitwise-style expense splitting, settlement math, UPI deep links, notifications). All secrets via env vars.

## User Personas & Core Requirements
- Group travellers (India-focused: INR, UPI deep links) booking + splitting expenses mid-trip; mobile-first.
- Non-negotiables: no hardcoded secrets, /api prefix, booking provider abstraction for future real APIs (Amadeus/IRCTC), PCI via Stripe Checkout only.

## User Preferences & Never-Dos
- Auth: Email/password JWT NOW; OAuth structure ready for user's own Google/Facebook keys LATER (buttons disabled in UI until keys supplied).
- AI: Emergent LLM key with Claude (claude-sonnet-4-6).
- Payments: Stripe claimable sandbox (Flow A) — user chose "Yes, use Stripe test mode".
- Maps: user gave GOOGLE_MAPS_API_KEY "AIzaSyAavrN-VFmqCAoznSTaSEgjuHLkAmguFFc" (labelled demo) — stored in backend/.env; UI uses Leaflet/OSM (reliable, keyless); Google Places can be wired later.
- Notifications: in-app + UPI deep links now; email/push (SendGrid/FCM) later.
- Never fabricate/hardcode production API keys.

## Architecture & Tech
- FastAPI + MongoDB (motor) + React 19 (CRA/craco) + shadcn + Tailwind; framer-motion; @phosphor-icons/react (duotone); react-leaflet v5 + OSM tiles.
- Backend modules: server.py (wiring/startup), db.py, models.py, auth.py (JWT+bcrypt, cookies+Bearer, brute-force lockout), providers.py (BookingProvider ABC + MockProvider, deterministic seeded results), destinations_data.py (6 curated hubs: goa, bali, rishikesh, jaipur, manali, kochi), routers_bookings/destinations/trips(+notifications)/chat/payments.
- Auth: access token 12h + refresh 7d; httpOnly cookies AND Authorization Bearer (frontend stores token in localStorage `travelo_token`).
- Trips: members have member_id (uuid), optional user_id link by email; invite_code join; expenses (equal/custom/percentage splits, server-validated); balances = net per member + greedy debt simplification; settlements collection adjusts nets; UPI deep link from creditor user's upi_vpa (profile field).
- Chat: SSE streaming /api/chat/stream, history in db.chat_messages (per user+session; session = "general" or "dest-{slug}"), Nominatim reverse geocode, Claude sonnet-4-6 via emergentintegrations.
- Payments: Stripe sandbox (acct_1Ty43fSQ5IbQI3xl), dynamic price_data in INR, purposes: booking|settlement; webhook /api/stripe/webhook; status poll with Stripe-direct fallback; apply_success idempotent (booking→confirmed / settlement→recorded+notification). Tax: tries automatic_tax, falls back gracefully (_tax_supported flag).
- Design: Playfair Display + DM Sans; palette terracotta #E25822 / teal #0B4F6C / beige #FDFBF7; glass navbar; grain overlay class.

## Implemented (2026-06, testing-agent PASSED 100% backend 23/23 + all frontend flows, iteration_1)
- Full MVP: auth (register/login/me/refresh/profile+UPI), booking search/create/pay flow (Stripe redirect verified), e-ticket page (print→PDF), bookings history, destinations hub w/ Leaflet map + transport tabs + cab deep links, group trips (create/join/members/contributions/expenses equal-custom-percentage/balances/settlements/reminders), in-app notifications w/ UPI Pay Now, Tara chat widget w/ geo consent + SSE streaming (Claude verified), Stripe checkout for bookings + settlements, landing page.
- Destination images swapped to context-matched Unsplash photos for Goa/Bali/Jaipur (HEAD-checked 200).

## Backlog (P0/P1/P2) & Next Tasks
- P1: Real Google/Facebook OAuth once user supplies keys; email (SendGrid) + push (FCM) notifications; payment proof upload on settlements.
- P2: Google Places live data for Destination Hub; PDF ticket via server-side lib; rate limiting beyond auth lockout; refunds UI; optional polish from test report: shadcn Calendar for date picker, DialogDescription a11y, explicit CORS origins for production.

## Decision Log
- Bearer token + cookies dual auth → preview proxy cookie quirks can't break auth.
- Leaflet/OSM over Google Maps JS → provided key labelled "demo", would risk broken map; key stored for later.
- Mock booking data deterministic (seeded by route+date) → stable results for testing.
- Stripe INR dynamic price_data (no catalog) → travel amounts are dynamic; amounts always computed server-side (booking doc / balances), never from client.
- Claude model: claude-sonnet-4-6 (playbook recommended for anthropic).

## Dead-Ends (Do NOT Retry)
- (none yet)

## Gotchas & Learnings
- Stripe sandbox job_id 684e0fee-ea17-479d-b145-bdb964b0ec8b; onboarding_url shared with user for claiming.
- react-leaflet v5 requires React 19 (OK here); default marker icons broken under webpack → custom divIcon pins used.
- FastAPI 422 detail is an array → formatApiError in lib/api.js handles it.
