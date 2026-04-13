This folder holds legacy Prisma-related files that are no longer part of the
active runtime surface.

Archived here:

- one-off reset and user bootstrap helpers such as `reset.js`,
  `reset-cliv.mjs`, and `update-users.mjs`
- manual phase SQL fragments such as `phase17_5_migration.sql`,
  `migration_seo_fields.sql`, and quote/content-image phase patches
- historical seed SQL helpers such as `seed_17b.sql` and
  `seed_ai_settings.sql`
- one-off page seeding and test helpers such as `seed_pages.mjs`,
  `test_models.js`, and `test_gemini.js`
- generated or snapshot-like artifacts such as `models.json`

These files are kept only for historical reference. Active database change flow
should prefer:

- `schema.prisma`
- tracked Prisma migrations in `prisma/migrations/`
- the canonical seed entry point `prisma/seed.mjs`
