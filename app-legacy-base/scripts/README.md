# Scripts Guide

This folder contains the active maintenance scripts for the project.

## Canonical Entry Points

- `check-db.ts`: lightweight DB connectivity and record-count check
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
- `npm run script:test-prisma`
- `npm run script:reset-user`
- `npm run script:setup-user`
- `npm run verify:content-qa`
- `npm run db:seed`

## Notes

- Active Prisma scripts should use the local Prisma 7 helpers in this folder instead of importing `@prisma/client` directly.
- `check-phones.mjs` is the canonical phone audit script.
- Root-level scripts should be reserved for active, named maintenance utilities rather than ad hoc local experiments.
- Historical phase-acceptance scripts that hard-coded old ports, credentials, tokens, or local artifact paths were removed during cleanup.
