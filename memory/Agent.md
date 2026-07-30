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
- Maps: user gave a GOOGLE_MAPS_API_KEY (labelled demo) — stored ONLY in backend/.env (redacted here per code-quality audit); UI uses Leaflet/OSM (reliable, keyless); Google Places can be wired later.
- Notifications: in-app + UPI deep links; EMAIL system built with console provider (logs + db.email_log) — SendGrid activates when user supplies SENDGRID_API_KEY (set EMAIL_PROVIDER=sendgrid).
- Never fabricate/hardcode production API keys.

## Architecture & Tech
- Design system (iter 10 reskin per /app/design_guidelines.json — "Editorial Luxury & Escapism"): fonts Cormorant Garamond (font-display headings) + Plus Jakarta Sans (body); palette: bg #F9F8F6, deep ocean #0A2540 (hover #123B66), coral accent #FF5A36 (hover #E64322), soft peach #FFB49B, borders #E5E4E0, muted #F0EFEB, tint #FFF1EC, avatar #EAE7E0. Shadcn CSS vars in index.css match. Canvas recap exports (recapExport.js) + backend PIL OG card (CormorantGaramond.ttf/PlusJakartaSans.ttf in backend/assets/fonts, wght-only variable axes) use same fonts/colors. OLD hexes (#E25822/#0B4F6C/#FDFBF7/#F9B384/#EAE3D9 etc.) fully retired — do not reintroduce.
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

## Implemented (2026-06 iter 5, testing-agent PASSED 11/11 backend + frontend 100%, iteration_5)
- Trip Chat Room: GET/POST /api/trips/{tid}/messages (member-only 403, whitespace-only 422), db.trip_messages indexed; TripChat.jsx tab in TripDetail (polls 4s, bubbles mine-right/others-left, Enter to send).
- Currency Choice: trips.currency (10 codes in models.CURRENCIES + csym()); validated on create; symbol flows through notifications/budget alerts/reminder emails/chat context/recap/frontend (money()/csym() in lib/api.js, fmt() in TripDetail); Stripe settlement checkout uses trip currency (JPY zero-decimal handled); UPI links INR-only (creditor_upi returns None otherwise); currency select in CreateTripDialog.
- Recap Download: lib/recapExport.js — exportImages (canvas-rendered PNG per slide → jszip .zip) + exportVideo (canvas.captureStream + MediaRecorder → .webm, 3s/slide fade transitions); download menu + progress indicator on RecapPage. Guarded drawSlide/negative-index race post-test.
- Cleaned all TEST_ trips from DB.

## Implemented (2026-06 iter 6, testing-agent PASSED 10/10 backend + frontend 100%, iteration_6)
- Trip Archive/Delete: POST /trips/{id}/archive|unarchive + DELETE /trips/{id} (organizer-only via require_organizer, 403 else); delete cascades expenses/settlements/trip_messages/chat_reads, soft-deletes memories, trip doc removed LAST; frontend: DotsThreeVertical menu on TripDetail (archive toggle + delete confirm dialog), Archived badge, collapsible "Archived trips" section on TripsPage.
- Chat Notifications: db.chat_reads (unique trip_id+user_id) tracks last_read_at; GET /trips/{id}/messages/unread + POST /messages/read (also marks chat notifications read); unread badge on Chat tab (10s poll in TripDetail) + "N new" badge on trip cards (list_trips returns unread_chat); deduped in-app "New messages in {trip}" notification — one unread per trip per user, message/timestamp refreshed on newer msgs, cleared when chat opened (TripChat POSTs read on each load).
- Recap Sharing Card: GET /api/recap/{token}/share — public HTML with OG meta + redirect to /recap/{token}; GET /api/recap/{token}/og.png — PIL 1200x630 card (first trip photo bg w/ gradient, else teal; Playfair/DMSans variable TTFs in backend/assets/fonts); Share-link button copies the /share URL.
- TripDetail 404 "Trip not found" state for deleted/invalid trip ids.

## Implemented (2026-06 iter 7, testing-agent PASSED 10/10 backend + frontend 100%, iteration_7)
- Chat Reactions: POST /trips/{tid}/messages/{mid}/react (❤️👍😂🎉😮, atomic $addToSet/$pull toggle, VS16-normalized, non-member 403, bad emoji 400); TripChat hover picker + tap-to-show on bubble (touch fallback), reaction chips w/ counts, own reaction highlighted.
- Trip Itinerary: db.itinerary_items CRUD — GET/POST /trips/{tid}/itinerary, PUT/DELETE /{item_id} (creator-or-organizer, 403 else), date YYYY-MM-DD + optional HH:MM validated, sorted date+time; TripItinerary.jsx tab (between Balances and Chat): Day N sections spanning trip dates, timeline cards w/ time chip/place/notes, per-day "+ add here", dialog add/edit; delete_trip cascade includes itinerary_items.
- Recap WhatsApp Share: recap-whatsapp-btn on RecapPage footer → wa.me/?text= with /api/recap/{token}/share link (synchronous window.open — keep it that way for popup blockers).

## Implemented (2026-06 iter 8, testing-agent PASSED 6/6 backend + frontend 100%, iteration_8)
- Itinerary In Recap: get_recap returns itinerary[]; buildItinerarySlides() in recapExport.js (shared by RecapPage + downloads) inserts "Day N — The plan" slides between title and memories; canvas drawSlide handles itinerary kind; >6 items/day shows "+N more" (no silent truncation).
- Expense From Plan: itinerary-expense-btn on every itinerary item (all members) → ExpenseDialog prefill prop (description=item title, category=activities), key `plan-{item.id}` for remount.
- Trip Countdown: tripCountdown() in TripsPage — "N days to go"/"Tomorrow!" (teal) upcoming, "On trip now" (green) during, none past/archived.

## Implemented (2026-06 iter 9, testing-agent PASSED 8/8 backend + frontend 100%, iteration_9)
- Recap Auto Post: maybe_post_recap() in routers_trips.py — when end_date < today (UTC), posts ONE "Travelo" system message in trip chat (kind recap, data.recap_token) + recap_ready notifications to registered members; atomic recap_auto_posted claim w/ rollback on failure; triggered lazily on GET /trips/{id} + hourly recap_sweep_loop (server.py startup); TripChat renders system msgs as centered teal card w/ "Watch the recap" button (chat-recap-link, no reactions).
- Facebook Login (config-gated, per integration_expert playbook): full OAuth code flow in auth.py — /auth/facebook/status | /login (302 to FB dialog, state cookie CSRF) | /callback (code→token→/me profile, create/link user by facebook_id then email, fallback email fb{id}@facebook.travelo, JWT cookies, redirect /dashboard; failures → /auth?fb_error=1 + state cookie cleared). ACTIVATES when FACEBOOK_APP_ID/FACEBOOK_APP_SECRET set in backend/.env (currently empty — button disabled via /status, user must also whitelist https://<domain>/api/auth/facebook/callback in Meta app). User skipped providing keys this round.

## Implemented (2026-06 iter 10, testing-agent frontend regression 100%, iteration_10)
- Full UI reskin (user request: travel-feeling fonts + attractive professional colors, UI-only): global hex swap via sed across src (excl. components/ui), index.css fonts/vars/glass, tailwind fontFamily, new unsplash hero (Landing) + side image (Auth), recap canvas + OG card fonts updated. Fixed pre-existing hydration warning (Badge inside <p>) on Members tab.

## Implemented (2026-06 iter 11, testing-agent PASSED 15/15 backend + frontend 100%, iteration_11)
- Explore Glow-Up: destinations_data.py grown 6→17 (added Agra, Leh, Paris, Tokyo, Santorini, Dubai, Bangkok, Singapore, Phuket, Rome, Istanbul — all images URL-verified, contextually checked); ExplorePage.jsx rewritten: bento grid (featured 2x2 first card, every 7th-ish wide), region chips (India 7/Asia 5/Europe 4/Middle East 1), search + count + empty state, plan-trip CTA.
- Settle-Up Nudge: maybe_post_recap also posts second system message kind "settle" (data.suggestions rows w/ from/to names, amount, upi_link via creditor_upi, data.currency) when balances have suggestions; skipped when settled. TripChat renders settle rows + "Pay via UPI" buttons (settle-nudge-* testids).

## Implemented (2026-06 iter 12, testing-agent PASSED 5/5 new + 22/23 regression + frontend 100%, iteration_12)
- Code Quality fixes (Critical+Important, user-approved): cookie-only auth — travelo_token fully removed from localStorage (api.js interceptor deleted, AuthContext, ChatWidget fetches use credentials:'include' only; backend cookies unchanged); Stripe key strict os.environ['STRIPE_SECRET_KEY'] (fallback removed); gen_pnr uses secrets.choice; React index keys → stable keys in 7 files (TripsPage/BookingPage form rows use _key uuid stripped before POST; TripDetail/TripChat suggestion keys from member ids/names; TicketPage/RecapPage composite keys). RecapPage key={idx} on AnimatePresence motion.div kept — load-bearing slide transition, NOT a list key. Maps key redacted from this file. Report's `is 200`/undefined-var findings were in already-deleted temp test scripts — nothing in live code.
- New backend suite /app/backend/tests/test_iter12_security.py (cookie auth, logout→401, PNR regex, checkout URL, google/session 4xx). TEST_ trips cleaned again post-regression.

## Backlog (P0/P1/P2) & Next Tasks
- P1: Facebook OAuth once user supplies Meta keys; SendGrid activation (set SENDGRID_API_KEY + EMAIL_PROVIDER=sendgrid); push notifications (FCM).
- P2: Google Places live data for Destination Hub; PDF ticket via server-side lib; rate limiting beyond auth lockout; refunds UI; chat pagination (`?since=` cursor — currently capped at last 300 msgs) + incremental polling; storage sweeper for files of hard-deleted trips (memories only soft-deleted); optional polish from test report: shadcn Calendar for date picker, DialogDescription a11y, explicit CORS origins for production; NOTE-level code-quality items user deferred: split 775-line TripDetail.jsx, memoize expensive array ops; stabilize flaky backend_test.py::TestTrips::test_settle_zeros_balance (order-dependent, passes alone).

## Decision Log
- Bearer token + cookies dual auth → preview proxy cookie quirks can't break auth.
- Leaflet/OSM over Google Maps JS → provided key labelled "demo", would risk broken map; key stored for later.
- Mock booking data deterministic (seeded by route+date) → stable results for testing.
- Stripe INR dynamic price_data (no catalog) → travel amounts are dynamic; amounts always computed server-side (booking doc / balances), never from client.
- Claude model: claude-sonnet-4-6 (playbook recommended for anthropic).
- Trip chat via 4s polling (not websockets/SSE) → simple, works through k8s ingress, adequate for small groups.
- Recap video is client-rendered WebM (canvas+MediaRecorder) → no server ffmpeg/storage cost; image set zipped client-side with jszip.
- Recap social preview: share link points at backend /api/recap/{token}/share (HTML w/ OG tags + instant redirect) because the SPA can't serve per-recap meta tags to crawlers; og.png generated server-side with PIL.

## Dead-Ends (Do NOT Retry)
- Object storage direct URL https://integrations.emergentagent.com/objstore → 401 "Invalid emergent key" in this env; MUST use INTEGRATION_PROXY_URL base (storage.py auto-resolves).

## Gotchas & Learnings
- Stripe sandbox job_id 684e0fee-ea17-479d-b145-bdb964b0ec8b; onboarding_url shared with user for claiming.
- react-leaflet v5 requires React 19 (OK here); default marker icons broken under webpack → custom divIcon pins used.
- FastAPI 422 detail is an array → formatApiError in lib/api.js handles it.
- rAF timestamp can be earlier than performance.now() captured just before → clamp frame index with Math.max(0, …) in canvas render loops (caused intermittent drawSlide undefined in recapExport.js).
- Parallel search_replace calls on the SAME file can race and silently drop OR corrupt an edit despite "successful" result (iter12: dropped logout edit + left dangling `xt(AuthContext);` fragment that blank-paged the whole app) — verify with grep after batches that touch one file multiple times; prefer ONE search_replace per file per batch.
- User's PRODUCTION deploy (journey-planner-5.dev.apps.emergentagent.com) does NOT auto-update — user must redeploy; "UI not changed" complaints are usually them viewing prod.
