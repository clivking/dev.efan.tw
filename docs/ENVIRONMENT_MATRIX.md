# Environment Matrix

## Goal

Make `dev`, `pre`, and `www` use the same runtime pattern with explicit differences only where necessary.

## Shared Architecture

All three environments should converge on the same model:

- one application image
- one PostgreSQL database
- one uploads directory
- one Cloudflare Tunnel or equivalent hostname mapping
- one environment-specific env file or secret source

## Matrix

| Area | dev | pre | www |
| --- | --- | --- | --- |
| Purpose | daily development and validation | release verification | production |
| Host | local WSL2 + Docker Desktop | Mac mini + OrbStack | Mac mini + OrbStack |
| Hostname | `dev.efan.tw` | `pre.efan.tw` | `www.efan.tw` |
| App container | `efan-dev-web` | `efan-pre-web` | `efan-www-web` |
| DB container | `efan-work-db` | `efan-pre-db` | `efan-www-db` |
| Local app port | `5000` | internal-only preferred | internal-only preferred |
| Local DB port | `5433` currently | internal-only preferred | internal-only preferred |
| Tunnel container | `efan-dev-tunnel` | `efan-pre-tunnel` | `efan-www-tunnel` |
| Code source | current working branch/commit | promoted release commit | promoted release commit |
| Data source | refreshed down from `www` when needed | refreshed down from `www` before validation | source of truth |
| Uploads | local working copy uploads | dedicated pre uploads | production uploads |

## Current Runtime Paths

These are the currently observed remote paths that matter operationally:

- `pre` build context root: `/Users/cliv/efan_server/build_context_pre`
- `pre` source tree used for build: `/Users/cliv/efan_server/build_context_pre/dev.efan.tw`
- `pre` runtime compose dir: `/Users/cliv/efan_server/pre`
- `pre` runtime compose file: `/Users/cliv/efan_server/pre/docker-compose.yml`
- `www` runtime source dir: `/Users/cliv/efan_server/nextjs`
- `www` runtime compose file: `/Users/cliv/efan_server/nextjs/docker-compose.yml`

## Current Compose Reality

The current repo contains compose files that are not interchangeable with the live Mac runtime files.

- local `dev` uses repo-managed compose files such as `compose.work-prod.yaml`
- current `pre` uses a split model: synced source in the remote build-context tree, but runtime compose in `/Users/cliv/efan_server/pre`
- current `www` relies on the remote runtime file `/Users/cliv/efan_server/nextjs/docker-compose.yml`
- the repo-level `compose.yaml` inside the remote `www` source tree is not the intended Step 5 production entrypoint

## Operational Guardrails

For stable releases, treat these as mandatory:

1. Step 4 `dev -> pre` data refresh must use a `dev` backup created after the latest Step 3 selective sync if Step 3 changed customer or quote data.
2. Step 5 `pre -> www` should rebuild and restart the production web stack while preserving the existing production DB and uploads volume.
3. A source sync to current `www` must exclude scratch paths such as `temp_web`.
4. A source sync to current `www` must not delete `/Users/cliv/efan_server/nextjs/docker-compose.yml`.
5. Before restarting production services, verify the actual service names from the runtime compose file rather than assuming the service names from repo-local compose files.

## Required Runtime Variables

These are the currently observed app-level env keys:

- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `JWT_SECRET`
- `PORTAL_JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `PUBLIC_ROOT`
- `UPLOADS_ROOT`

Additional env keys used for specific cases:

- `EFAN_SKIP_TURNSTILE`
- `GUIDE_SMOKE_BASE_URL`
- `PUPPETEER_EXECUTABLE_PATH`
- `IS_BUILD_PHASE`

## Recommended Values By Environment

### dev

- `NODE_ENV=production` for the production-like compose runtime
- `NEXT_PUBLIC_APP_URL=https://dev.efan.tw`
- `DATABASE_URL` points to dev DB container
- `PUBLIC_ROOT=/app/public`
- `UPLOADS_ROOT=/app/public/uploads`
- `EFAN_SKIP_TURNSTILE=true` only when local/dev diagnostics require it

### pre

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://pre.efan.tw`
- `DATABASE_URL` points to pre DB container
- `PUBLIC_ROOT=/app/public`
- `UPLOADS_ROOT=/app/public/uploads`
- `EFAN_SKIP_TURNSTILE` should normally be unset unless a specific staging bypass is needed

### www

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://www.efan.tw`
- `DATABASE_URL` points to production DB container
- `PUBLIC_ROOT=/app/public`
- `UPLOADS_ROOT=/app/public/uploads`
- no Turnstile bypass

## Compatibility Rules

1. `ENCRYPTION_KEY` must remain compatible with the DB snapshot in use
2. `JWT_SECRET` and `PORTAL_JWT_SECRET` should be environment-specific and never committed
3. app image should be identical between `pre` and `www` for the same release commit
4. differences between environments should live in env/secrets and data, not in application code

## Deployment Goal

When this matrix is complete:

- `dev` proves feature behavior
- `pre` proves release readiness
- `www` runs the same release artifact with production data
