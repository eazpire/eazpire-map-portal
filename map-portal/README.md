# eazpire Map Portal (source)

Vite + React + Tailwind SPA for **map.eazpire.com**.

Canonical source of the ecosystem architecture map. Built into `map-static/` via:

```bash
npm run sync:map-static
```

## Local UI only

```bash
cd map-portal
npm install
npm run dev
```

## Worker

Deployed as Cloudflare Worker `eazpire-map-portal` — see `docs/deployment/map-portal.md`.

Mirror repo: `eazpire/eazpire-map-portal`.
