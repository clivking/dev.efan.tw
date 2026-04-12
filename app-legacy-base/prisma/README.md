# Prisma Folder Guide

This folder contains the Prisma schema, SQL seed files, and a few script helpers.

Primary files:
- `schema.prisma`
- `prisma-client.mjs`
- `prisma-client.cjs`
- `prisma-client.ts`
- `seed.mjs`

Notes:
- Prisma 7 CLI configuration lives in the project root at `prisma.config.ts`.
- The package seed command points to `prisma/seed.mjs`.
- Historical or temporary Prisma-related scripts should be reviewed before use.
- Older duplicate seed variants can be archived under `prisma/archive/legacy/` when they are no longer needed.
