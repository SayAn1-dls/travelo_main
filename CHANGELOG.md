# TRAVELO CHANGELOG

All notable changes to Travelo are documented in this file.
Format: [Semantic Versioning](https://semver.org/) — Conventional Commits.

---

## [4.0.2] — 2026-08-04
### 🚀 THE BESTEST UI — SILICON BRUTALIST ARCHITECTURE

#### Added
- `src/constants/quotes.js` — Elite travel quote corpus (15 curated quotes)
- `src/constants/colors.js` — Silicon transparency design token system
- `src/constants/routes.js` — Single source of truth for all navigation paths
- `src/utils/formatDate.js` — Mission-grade date formatting (boarding, relative, duration)
- `src/utils/generateId.js` — Zero-collision mission ID generator
- `src/utils/storage.js` — Zero-network LocalStorage persistence engine
- `src/utils/cn.js` — Conditional Tailwind className utility
- `src/hooks/useLocalStorage.js` — Reactive state with LS persistence
- `src/hooks/useDebounce.js` — Silicon-smooth search latency reducer
- `src/hooks/useMediaQuery.js` — Elite mobile-first responsive breakpoints
- `src/hooks/useOnlineStatus.js` — Zero-network connectivity awareness
- `src/hooks/usePrevious.js` — Animation delta tracking hook
- `src/components/Loader.jsx` — Brutalist loading spinner with orange pulse
- `src/components/Badge.jsx` — Mission status indicator atom
- `src/components/Toast.jsx` — Auto-dismiss notification system
- `src/components/ErrorBoundary.jsx` — Production-grade fault isolation
- `src/components/OfflineIndicator.jsx` — Zero-network mode indicator
- `src/components/ProtectedRoute.jsx` — Auth-walled route guard
- `src/lib/db.js` — Zero-network localStorage mock API (trips, users, mail)
- `src/lib/validators.js` — Institutional-grade form validation library
- `src/lib/analytics.js` — Analytics stub (PostHog/Mixpanel ready)
- `src/firebase/config.js` — Firebase v9 modular auth scaffold
- `src/context/TripContext.jsx` — Global mission state via useReducer

#### Changed
- `src/pages/Landing.jsx` — Rebuilt with animated counters, stats, testimonials
- `src/App.js` — Integrated AuthProvider, ErrorBoundary, OfflineIndicator

---

## [4.0.0] — 2026-08-02
### 🏗️ ROOT ARCHITECTURE SHIFT (v4.0)
- Moved React app from `/frontend` subfolder to repository root
- Nuked stale root `index.html` that was hijacking Vercel build
- Restored elite README with ASCII art and Mermaid diagrams
- Configured `vercel.json` for SPA routing

---

## [3.0.0] — 2026-07-28
### ⚡ SILICON BRUTALIST UI ENGINE
- Bebas Neue 16vw headers
- Permanent Marker accent font
- Electric Orange / Pitch Black palette
- 60px silicon transparency (frosted glass)
- Zero-Network LocalStorage engine activated
