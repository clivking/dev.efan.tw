This folder holds legacy one-off scripts that were removed from the active
`scripts/` root during cleanup.

These files are kept only as historical reference for past vendor imports,
targeted data repairs, and ad hoc debugging. They are not part of the current
canonical maintenance workflow.

Current archive contents include:

- vendor/product seed scripts such as `seed-acti-*`, `seed-soyal-*`,
  `seed-akuvox*`, `seed-cctek-b600d.js`, and `seed-tecom.js`
- one-time repair helpers such as `fix-acti-names.js`,
  `fix-soyal-names.js`, `fix-image-urls.js`, `fix-phone-data.js`,
  and `fix-prisma.js`
- one-off debugging helpers such as `debug-quote-items.mjs`
- destructive cleanup/import helpers such as `cleanup-*`,
  `clear-customers.*`, `import-customers.js`, and `import_data.sql`
- one-time backfill/update helpers such as `backfill-*`,
  `update-*`, and `restore-guides-copy.mjs`
- local asset conversion helpers with hard-coded workstation paths such as
  `convert-access-photos.mjs` and `convert-photos.mjs`
- historical migration/bootstrap helpers such as `migrate-*`,
  `seed-categories.ts`, and `add-title-suffix-setting.ts`
- old environment-specific operator helpers such as `dev-refresh.sh`,
  `db-check.mjs`, `debug_stats.ts`, and `verify-ids.mjs`

If one of these ever needs to be reused, it should be reviewed, renamed,
documented, and promoted back into the active root with a stable purpose.
