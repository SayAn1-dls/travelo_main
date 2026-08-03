# TRAVELO v3.0 — Silicon Brutalist

> The squad travel OS. Plan. Split. Explore. No drama.

## Tech Stack
- React 18 + React Router v6
- Tailwind CSS v3
- LocalStorage persistence (offline-first, zero network errors)
- Framer Motion
- Phosphor Icons

## UI Design System
- **Brutalist**: Pitch black (#030303), Bebas Neue, 14vw headings, electric orange (#FF4D00)
- **Silicon Transparency**: 60px backdrop-blur frosted glass for forms & data cards only
- **Permanent Marker** quotes throughout for personality

## Pages
- `/` — Landing (Brutalist hero)
- `/auth` — Login/Signup (Silicon glass form)
- `/dashboard` — Command HQ (live stats from localStorage)
- `/trips` — Mission Board (CRUD, localStorage)
- `/trips/:id` — Mission Control (expenses, min-cash-flow settlements)
- `/book` — Logistics (flight/hotel search)
- `/bookings` — Ledger (all bookings recap)
- `/payment` — Brutalist checkout (localStorage)
- `/explore` — Memories vault (photo upload UI)
- `/squad-mail` — SquadMail (team messaging)

## Setup
```bash
cd frontend && npm install && npm start
```

## Deploy
Vercel auto-deploys from `main`. SPA rewrites configured in `vercel.json`.
