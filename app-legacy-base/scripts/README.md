# Scripts Guide

This folder contains the active maintenance scripts for the project.

## Canonical Entry Points

- `check-db.ts`: lightweight DB connectivity and record-count check
- `check-uploads-integrity.mjs`: checks `uploaded_files` references against the local uploads filesystem
- `fix-uploads-extension-drift.mjs`: repairs high-confidence extension drift in `uploaded_files`
- `fix-uploads-document-mappings.mjs`: repairs high-confidence encoded-path and SOYAL manual document mappings
- `db-check.mjs`: deeper manual DB audit used for phase verification
- `check-phones.mjs`: canonical phone-field audit script
- `test-prisma.mjs`: Prisma client smoke test
- `force-reset-user.mjs`: local admin/user recovery helper
- `setup-user.mjs`: local user bootstrap helper
- `content-qa.ps1`: lightweight rendered-content QA against `dev.efan.tw`
- `content-qa.sh`: WSL wrapper that delegates to the PowerShell QA script on this machine
- `prisma-client.mjs`
- `prisma-client.cjs`
- `prisma-client.ts`

## Recommended npm Commands

- `npm run script:check-db`
- `npm run script:check-uploads`
- `npm run script:fix-uploads-drift`
- `npm run script:fix-uploads-docs`
- `npm run script:test-prisma`
- `npm run script:reset-user`
- `npm run script:setup-user`
- `npm run verify:content-qa`
- `npm run db:seed`

## Notes

- Active Prisma scripts should use the local Prisma 7 helpers in this folder instead of importing `@prisma/client` directly.
- `check-phones.mjs` is the canonical phone audit script.
- `check-uploads-integrity.mjs` is the canonical uploads integrity audit.
- `fix-uploads-extension-drift.mjs` should be run as a dry-run first, then with `--apply` only for exact alternate-extension repairs.
- `fix-uploads-document-mappings.mjs` should be run as a dry-run first, then with `--apply` only for exact decoded-path or SOYAL `_DM.pdf` mappings.
- Root-level scripts should be reserved for active, named maintenance utilities rather than ad hoc local experiments.
- Historical phase-acceptance scripts that hard-coded old ports, credentials, tokens, or local artifact paths were removed during cleanup.
- Vendor-specific one-off seed, fix, and debug scripts have been moved to `scripts/archive/legacy/` so the root stays focused on current maintenance tools.
- Destructive cleanup/import helpers, one-time backfills, and workstation-bound conversion scripts were also moved to `scripts/archive/legacy/`.
- Historical migrations, bootstrap helpers, and environment-specific debug/refresh scripts were moved to `scripts/archive/legacy/`.
- Manual SQL probes and one-off SQL patch files were moved to `scripts/archive/legacy/` as well.
