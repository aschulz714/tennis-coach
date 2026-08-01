# tennis-coach

A personal tennis-coaching PWA: log matches and practice sessions, sync results and
ratings from UTR, and get doubles-specific tactical advice from an AI coach that
actually knows your schedule, your logged sessions, and your rating history.

Built for real personal use during USTA league play — not a demo.

## What it does

- **AI coach chat** — a Claude-powered coach whose system prompt is assembled
  server-side from real context: upcoming match schedule, logged session history,
  and player profile. Advice is grounded in the data ("your 4.5 losses cluster on
  return games — here's what to drill"), not generic tips.
- **Session logging** — matches and practices with surface, partner, team, and
  outcome, persisted client-side in localStorage.
- **UTR integration** — server-side helper against the UTR Sports API: player
  search, profile, results, and rating sync, with JWT caching (55-minute expiry to
  stay inside UTR's 1-hour tokens).
- **Stats and schedule views** — trends across teams, surfaces, and partners.
- **PIN-gated** — single-user auth via an httpOnly cookie set against a
  server-side PIN; the middleware protects every route.
- **Installable PWA** — next-pwa service worker.

## Architecture notes

The interesting part is the context engineering, not the chat UI. The Claude call
happens in a Next.js API route (`src/app/api/coach/route.ts`), so the API key never
reaches the browser, and the system prompt is rebuilt per request with current
schedule context injected. The UTR helper (`src/lib/utr.ts`) is likewise
server-only: credentials stay in env vars, tokens are cached in memory, and the
client only ever sees shaped JSON.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · @anthropic-ai/sdk · next-pwa

## Run locally

```bash
npm install
cp .env.example .env.local   # or create .env.local with the vars below
npm run dev
```

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key for the coach chat |
| `COACH_PIN` | The PIN that gates the app |
| `UTR_EMAIL` / `UTR_PASSWORD` | UTR account for authenticated profile/results endpoints |
