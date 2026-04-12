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
- old compose leftovers `compose.old-app.yaml`, `compose.old-db.yaml`, and `compose.work-app.yaml` were removed
- temporary app-local docs and `scripts/archive/` were removed
- legacy one-off acceptance scripts with hard-coded ports, credentials, tokens, or artifact paths were removed from `app-legacy-base/scripts`
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
- `Dockerfile`
- `.env.compose-prod`

Reason:

- these are still part of the working runtime
- we have not yet audited them feature by feature

## Review Later

- deep script consolidation
- old content-planning docs that may have been fully superseded

Reason:

- these still need feature-level judgement
- remove only after we confirm they are not part of ongoing content work

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
