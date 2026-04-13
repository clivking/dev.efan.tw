# Prisma Folder Guide

This folder contains the active Prisma schema, canonical seed entry point, and
tracked Prisma migrations for the working runtime.

Primary files:

- `schema.prisma`
- `prisma-client.mjs`
- `prisma-client.cjs`
- `prisma-client.ts`
- `seed.mjs`
- `migrations/`

Notes:

- Prisma 7 CLI configuration lives in the project root at `prisma.config.ts`.
- The package seed command points to `prisma/seed.mjs`.
- Keep the top-level `prisma/` folder focused on the current schema and
  migration history.
- Historical manual phase SQL, one-off reset helpers, AI test files, and model
  snapshots belong under `prisma/archive/legacy/`.
