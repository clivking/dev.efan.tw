# Scripts Governance

## Goal

Reduce confusion in `app-legacy-base/scripts` by separating canonical tools from historical one-off scripts.

## Canonical Script Types

### Runtime Checks

- `check-db.ts`
- `check-uploads-integrity.ts`
- `check-phones.mjs`
- `test-prisma.mjs`

### Recovery / Maintenance

- `force-reset-user.mjs`
- `setup-user.mjs`
- `cleanup-obsolete-settings.ts`
- `repair-garbled-db.mjs`

### Verification

- `verify-quote-save-regression.mjs`
- `verify-guides-smoke.ts`
- `content-qa.ps1`
- `content-qa.sh`

### Build / Tooling

- `run-webpack-build.mjs`
- `check-encoding.mjs`
- `scan-garbled-copy.mjs`
- `scan-garbled-db.mjs`
- Prisma helper files

## Review Buckets

The remaining scripts should be reviewed into explicit buckets:

- `seed-*`: data bootstrapping or historical content import
- `fix-*`: targeted one-time repairs
- `migrate-*`: one-time structured migrations
- `debug-*`: temporary investigation helpers
- `.sql`: manual operator helpers that may deserve a proper runbook or wrapper

## Rules

1. do not add new one-off scripts to the root without deciding their bucket
2. if a script is still needed, give it a stable purpose and document it
3. if a script is only historical, remove it or isolate it
4. canonical scripts should be reachable through `package.json` where practical

## Immediate Next Cleanup

- audit `seed-*` scripts for duplication by product/vendor family
- audit `fix-*` scripts for one-time DB repairs that should no longer stay active
- audit `debug-*` scripts for removal or isolation
