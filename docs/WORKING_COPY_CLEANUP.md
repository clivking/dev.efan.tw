# Working Copy Cleanup

## Goal

Trim obvious baggage from `app-legacy-base` without changing product behavior.

## Safe To Remove

- `.next`
- `.build-home`
- `.codex`
- `.env`
- `.github`
- `ops/caddy/dev`

Reason:

- generated cache or local tool residue
- should not be source of truth
- will be recreated when needed

Current note:

- `.build-home` and `.codex` were removed
- `.env` was removed
- legacy `.github` workflow was removed
- legacy `ops/caddy/dev` files were removed
- `.next` is still present because part of the cache is owned by the running container user
- treat `.next` as disposable runtime cache and do not track it

## Keep For Now

- `src`
- `public`
- `prisma`
- `scripts`
- `package.json`
- `package-lock.json`
- `Dockerfile.dev`
- `.env.compose-work`

Reason:

- these are still part of the working runtime
- we have not yet audited them feature by feature

## Review Later

- `docker-compose.yml`
- `Dockerfile`
- `Dockerfile.macmini`

Reason:

- probably legacy maintenance overhead
- not required for immediate local work
- remove only after we confirm nothing still depends on them

## Next Audit Reference

Continue cleanup with:

- `docs/WORKING_COPY_FEATURE_INVENTORY.md`
- `docs/AI_TELEGRAM_DEPENDENCIES.md`
- `docs/WEBSITE_SURFACE_INVENTORY.md`
- `docs/NAVIGATION_TRIAGE.md`
- `docs/HOMEPAGE_TRIAGE.md`
- `docs/ADMIN_FUNCTION_MAP.md`

Use that file to decide:

- what must stay online first
- what can wait
- what should be isolated before deletion
