# Repo Cleanup Roadmap

This workspace was rebuilt from the previous Chinese-path repo into:

- `D:\Coding\efan.tw`

Migration goals:

- keep the working application code and git history
- exclude cache, temporary files, debug output, and local build artifacts
- reduce root-level clutter before future cleanup work

Included in this rebuilt workspace:

- `.git`
- `src`
- `public`
- `prisma`
- `scripts`
- `docs`
- top-level config and Docker files
- current `.env` and `.env.example`

Excluded on purpose:

- `.next`
- `node_modules`
- `logs`
- `tmp`
- lighthouse JSON exports
- temporary PDF/check files
- loose root debug/test scripts and outputs
- `.agent` and `.agents`

Recommended phase 2 cleanup:

- keep `check-db.ts` as the lightweight DB check and `db-check.mjs` as the deeper audit script unless one fully replaces the other
- archive duplicate format variants such as extra `.js` copies when an `.mjs` or `.ts` canonical entry already exists
- choose one canonical entry for duplicated script formats such as `.js` and `.mjs`
- review whether `Dockerfile.macmini` is still needed
- decide whether `scripts/archive` and `prisma/archive` should stay in the main repo
- move one-off local utilities out of the root forever

Validation checklist after migration:

1. `npm install`
2. `npm run build`
3. `docker compose build app-dev`
4. `docker compose up -d app-dev`
5. verify health and live response
