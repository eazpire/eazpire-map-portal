# Map Portal Mirror Repo Setup

Mirror: **`eazpire/eazpire-map-portal`**

## Create

```bash
npm run map:create-repo
```

Needs a GitHub token with repo create/push (same fine-grained PAT pattern as brand):

- Prefer `MAP_REPO_PUSH_TOKEN` in `.dev.vars` / GitHub Secrets
- Fallback: `BRAND_REPO_PUSH_TOKEN` / `PARTNER_REPO_PUSH_TOKEN` / `ANDROID_REPO_PUSH_TOKEN`

## Sync

```bash
npm run map:sync
```

Copies map portal sources + built `map-static/` into the mirror and pushes `main`.

## Permissions

Fine-grained PAT for `eazpire/eazpire-map-portal`:

- Contents: Read and write
- Metadata: Read-only
