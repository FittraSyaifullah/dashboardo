# Dashboardo — Skim Pintar Dashboard

An admin dashboard for **Masjid Ar-Raudhah**'s **Skim Pintar** donation membership programme. Manages donator records, processes new applications, tracks payment history, and supports multi-session state via Vercel KV (Upstash) with automatic in-memory fallback.

---
<img width="1889" height="736" alt="image" src="https://github.com/user-attachments/assets/59b8438c-0db3-4c12-8f6c-07802d733498" />


## Features

- **Current Donators** — view, search, and manage active members with expandable household rows
- **Incoming Applications** — approve or reject pending applicants from a live queue
- **Deactivated Members** — audit trail of inactive donators with reactivation support
- **Donator Drawer** — slide-out detail panel with payment history timeline and audit log
- **Optimistic UI** — mutations apply instantly client-side, reconciled by 8-second server polling
- **PWA** — installable as a standalone app with a Service Worker cache-first shell
- **Notifications** — push notification support via the Service Worker

---

## Architecture

```
┌──────────────────────────────────────────┐
│                 Browser                  │
│                                          │
│  React 19 SPA (no router)                │
│  ┌────────────┐  ┌──────────────────┐    │
│  │  Navbar    │  │  DonatorDrawer   │    │
│  └────────────┘  └──────────────────┘    │
│  ┌────────────────────────────────────┐  │
│  │           App.tsx                  │  │
│  │  (global state + 8s polling loop)  │  │
│  │                                    │  │
│  │  DonatorTable  IncomingTable       │  │
│  └────────────────────────────────────┘  │
│                   │ fetch                │
└───────────────────┼──────────────────────┘
                    │
          ┌─────────▼─────────┐
          │  GET/POST         │
          │  /api/donators    │
          │  (Express handler)│
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────────────────┐
          │  Storage (with fallback)       │
          │                                │
          │  1. Vercel KV (Upstash Redis)  │
          │     KV_REST_API_URL + TOKEN    │
          │                                │
          │  2. In-memory globalThis       │
          │     (zero-config dev/MVP)      │
          └────────────────────────────────┘
```

### State Management

No external state library. All UI state lives in `App.tsx` via `useState`. The component tree is shallow enough that prop drilling is manageable — child components receive data and callback handlers as props.

### Tab Navigation

Three views (`current`, `incoming`, `deactivated`) are driven by a single `activeTab` state string. There is no client-side router.

### Optimistic Updates

Every mutation (approve, reject, deactivate, reactivate) fires an API POST and simultaneously updates local state optimistically. On API failure, the `.catch()` handler applies the change locally. The 8-second polling loop reconciles any divergence across sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Language | TypeScript ~5.8 |
| Build Tool | Vite 6.2 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Animation | Motion (`motion/react`) v12 |
| Icons | Lucide React |
| API Layer | Express 4 (serverless-style handler) |
| Storage (primary) | Vercel KV / Upstash (Redis-compatible) |
| Storage (fallback) | In-memory `globalThis` |
| AI SDK | `@google/genai` (Gemini — integrated, not yet wired to UI) |
| PWA | Service Worker + Web App Manifest |

---

## Project Structure

```
dashboardo/
├── api/
│   └── donators.ts          # REST API handler (GET + POST with action dispatch)
├── public/
│   ├── icons/app-icon.svg   # PWA app icon
│   ├── manifest.webmanifest # PWA manifest
│   └── sw.js                # Service Worker (cache-first + push notifications)
├── src/
│   ├── components/
│   │   ├── DonatorDrawer.tsx  # Slide-out detail panel (payment history, audit log)
│   │   ├── DonatorTable.tsx   # Shared table for Current & Deactivated tabs
│   │   ├── IncomingTable.tsx  # Applications queue table
│   │   └── Navbar.tsx         # Fixed top navigation bar
│   ├── App.tsx               # Root component — state, polling, action dispatch
│   ├── data.ts               # TypeScript interfaces & mock seed data
│   ├── index.css             # Global styles (Tailwind v4 + custom scrollbar)
│   └── main.tsx              # React DOM entry + Service Worker registration
├── index.html                # Vite HTML shell
├── vite.config.ts            # Vite + Tailwind plugin config
├── tsconfig.json             # TypeScript config
├── metadata.json             # App metadata (AI Studio descriptor)
└── .env.example              # Environment variable documentation
```

---

## API

Single endpoint at `/api/donators`.

| Method | Body `type` | Description |
|---|---|---|
| `GET` | — | Returns full state (`currentDonators` + `incomingDonators`) |
| `POST` | `ingest` | Add a new pending applicant |
| `POST` | `ingestApproved` / `approved` | Add directly to active donators |
| `POST` | `approve` | Promote incoming → current |
| `POST` | `reject` | Remove from incoming queue |
| `POST` | `deactivate` | Set a donator's status to Inactive |
| `POST` | `reactivate` | Restore a donator to Active |

POST requests are optionally protected by an `x-api-key` header matched against `MVP_API_KEY`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```
GEMINI_API_KEY=""       # Gemini AI API key (injected by Vite into the bundle)
APP_URL=""              # Deployed service URL (Cloud Run / Vercel)
MVP_API_KEY=""          # Optional: protects POST /api/donators
KV_REST_API_URL=""      # Vercel KV / Upstash REST endpoint
KV_REST_API_TOKEN=""    # Vercel KV / Upstash bearer token
```

When `KV_REST_API_URL` and `KV_REST_API_TOKEN` are absent, the API falls back to in-memory state — suitable for local development with no external dependencies.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Type-check
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Design System

- **Theme:** Dark, GitHub-inspired background (`#0d1117`, `#161b22`)
- **Accent:** Forest green (`#2d6a4f`, `#40916c`, `#74c69d`) — reflecting the mosque/nature identity
- **Motion:** Spring animations via `motion/react` — tab indicator sliding (`layoutId`), row enter/exit, drawer slide-in
- **Currency:** SGD — payment methods include GIRO and e-GIRO (Singapore bank direct debit)
