# Caddy Live Audit 2026-04-09

## Source

Live file fetched from:

- `/Users/cliv/efan_server/proxy/Caddyfile`

Live container:

- `proxy_caddy`

Related compose:

- `/Users/cliv/efan_server/proxy/docker-compose.yml`

## Current Live Rules

### `http://www.efan.tw`

- gzip/zstd enabled
- reverse proxy to `efan_nextjs_web:3000`

### `http://efan.tw`

- redirects to `https://www.efan.tw{uri}`

### `http://pre.efan.tw`

- adds `X-Robots-Tag: noindex, nofollow`
- reverse proxy to `efan_pre_web:3000`

### `http://www.tada.com.tw` and `http://tada.com.tw`

Contains multiple path redirects:

- PDF model extraction -> `/products/{model}`
- `/電話總機*` -> `/services/phone-system`
- `/電子鎖*` -> `/products/category/electronic-lock`
- `/旅館房控系統*` -> `/`
- `/門禁讀卡機*` -> `/products/category/reader`
- `/門禁*` -> `/services/access-control`
- `/關於一帆*` -> `/about`
- `/下載*` and `/downloads*` -> `/support/downloads`
- catch-all -> `/`

## Keep / Migrate / Remove

### Keep in Caddy

- `efan.tw -> https://www.efan.tw{uri}`
  Reason: host and protocol canonicalization belongs at the edge.

- `pre.efan.tw` adds `X-Robots-Tag: noindex, nofollow`
  Reason: environment-level index control is acceptable at the edge, though app-side parity should still be verified.

- reverse proxy upstream routing for `www.efan.tw` and `pre.efan.tw`
  Reason: edge responsibility.

### Migrate to app

These `tada.com.tw` content redirects should move into app-owned redirect rules if they are still needed:

- PDF model extraction rule
- `/電話總機*`
- `/電子鎖*`
- `/旅館房控系統*`
- `/門禁讀卡機*`
- `/門禁*`
- `/關於一帆*`
- `/下載*`
- `/downloads*`
- catch-all content redirect to `/`

Reason:

- these are content and SEO redirects, not edge responsibilities
- `efan-deploy` will not deploy Caddy changes
- `DEV` cannot naturally mirror these rules unless the edge also exists locally
- path redirect ownership should stay in the app

### Remove after migration

Once the app version is deployed and validated on `PRE` and `WWW`, remove the `tada.com.tw` content redirects from Caddy to avoid drift.

## Risks Found

### 1. `tada.com.tw` path redirects currently live only at the edge

This means:

- local app testing does not fully represent live behavior
- future edits may be forgotten because the rules are not in the app manifest
- `WWW` may keep working while `DEV` and `PRE` behave differently

### 2. Caddy logs show repeated `/.well-known/acme-challenge/...` lookups

This confirms the `/.well-known/` traffic is real edge traffic and not an app-specific SEO problem.

Current interpretation:

- likely TLS / ACME or external control-panel probing
- should not be mixed into app SEO redirect handling
- should not be globally blocked

### 3. Forwarded scheme looks inconsistent

Caddy logs show requests with:

- `Cf-Visitor: {"scheme":"https"}`
- `X-Forwarded-Proto: http`

This may not be immediately harmful if the app determines canonical origin elsewhere, but it is worth auditing because host/protocol metadata inconsistency can affect:

- canonical URL generation
- Open Graph URL generation
- absolute URL generation in redirects or metadata

## Recommended End State

### Edge owns

- `efan.tw -> https://www.efan.tw{uri}`
- `http -> https`
- reverse proxy
- `pre.efan.tw` noindex policy
- TLS / ACME

### App owns

- all fixed legacy path redirects
- all content migration redirects
- all old PDF landing redirects
- all old service and category redirects
- all model and product redirects

## Migration Order

1. Inventory the `tada.com.tw` paths that still receive traffic.
2. Add the required rules to [redirect-rules.ts](/D:/Coding/efan.tw/web/src/lib/redirect-rules.ts).
3. Verify locally.
4. Deploy to `PRE` with `efan-deploy`.
5. Validate on `PRE`.
6. Promote to `WWW`.
7. Remove the duplicated `tada.com.tw` content redirects from Caddy.
8. Re-verify `WWW`.

## Decision Summary

The live `WWW` Caddy config is mostly clean for `efan.tw` itself.

The main architectural problem is that `tada.com.tw` content redirects are still living in Caddy instead of the app.

That is the next cleanup target if the goal is long-term consistency and easier deployment.
