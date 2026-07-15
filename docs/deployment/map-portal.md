# Map Portal (`map.eazpire.com`)

Ecosystem architecture map — portals, workers, apps, infra — as its own Cloudflare Worker.

## Stack

| Piece | Path |
|-------|------|
| SPA source | `map-portal/` (Vite + React + Tailwind + React Flow) |
| Built assets | `map-static/` (via `npm run sync:map-static`) |
| Worker | `src/map-worker.js` + `src/features/map/` |
| Config | `wrangler-map.toml` |
| Mirror | `eazpire/eazpire-map-portal` |

## Commands

```bash
# UI only
npm run dev:map-ui

# Worker local (builds static first)
npm run dev:map

# DNS AAAA 100:: for map.eazpire.com
npm run map:dns

# Deploy worker
npm run deploy:map

# Mirror repo
npm run map:create-repo
npm run map:sync
```

## Auth

**Admin-only** — same allowlist as `admin.eazpire.com`:

- `ADMIN_OWNER_EMAILS` / `ADMIN_OWNER_IDS` in `wrangler-map.toml`
- Magic link via Resend → `/auth/verify` → cookie `admin_partner_session`
- Server gates SPA assets (no session → login page only)

```bash
npm run map:secrets   # RESEND_API_KEY + PARTNER_JWT_SECRET
npm run deploy:map
```

Ops: `map-auth-request` / `map-auth-me` / `/auth/logout`

## CI

- `.github/workflows/deploy-map-portal.yml` — deploy on map path changes
- `.github/workflows/sync-map-portal.yml` — push mirror

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; mirror push via `MAP_REPO_PUSH_TOKEN` (or brand/partner/android fallback).
