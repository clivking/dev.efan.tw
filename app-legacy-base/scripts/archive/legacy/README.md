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

If one of these ever needs to be reused, it should be reviewed, renamed,
documented, and promoted back into the active root with a stable purpose.
