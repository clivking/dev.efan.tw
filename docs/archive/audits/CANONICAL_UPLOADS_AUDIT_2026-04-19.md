# Canonical Uploads Audit 2026-04-19

## Final Product Cleanup Result

This file started as the pre-migration audit snapshot and now records the final
state after canonical product asset migration and cleanup.

Final command:

```bash
DATABASE_URL='postgresql://efan_work:change-me-work@localhost:5433/efan_working_copy?schema=public' \
UPLOADS_ROOT=/home/cliv/projects/dev.efan.tw/app-legacy-base/public/uploads \
npm --prefix app-legacy-base run script:audit-canonical-uploads -- --json-out=/tmp/canonical-uploads-audit-final-clean.json
```

Final product asset result:

- filesystem files under uploads: `343`
- `uploaded_files` rows: `325`
- DB upload references found: `353`
- source upload references found: `12`
- missing `uploaded_files` rows: `0`
- missing referenced paths: `0`
- legacy missing public signature paths: `4`
- unreferenced filesystem files: `0`
- canonical product path violations: `0`
- flat product files: `0`
- duplicate basenames: `0`

The only remaining legacy findings are old public quote signatures that predate
the private signature storage flow:

- four `/api/uploads/signatures/...png` quote signature references

The product upload tree is now canonical. New product images and documents are
written under `products/{MODEL}/images/` and `products/{MODEL}/documents/`.
Unused filesystem files and empty folders found by the final audit were removed.
New quote signatures are saved in private storage through the quote signature
API and are served through authenticated/token-scoped routes, so these old public
signature references are tracked separately as legacy data.

## Initial Snapshot

## Scope

This audit used the new read-only canonical uploads inventory script:

```bash
DATABASE_URL='postgresql://efan_work:change-me-work@127.0.0.1:5433/efan_working_copy?schema=public' \
UPLOADS_ROOT=/home/cliv/projects/dev.efan.tw/app-legacy-base/public/uploads \
npm run script:audit-canonical-uploads -- --json-out=/tmp/canonical-uploads-audit.json
```

The script does not move, rename, update, quarantine, or delete files.

## Summary

- filesystem files under uploads: `381`
- `uploaded_files` rows: `327`
- DB upload references found: `355`
- source upload references found: `15`
- missing `uploaded_files` rows: `2`
- missing referenced paths: `8`
- unreferenced filesystem files: `57`
- canonical product path violations: `317`
- flat product files: `335`
- duplicate basenames: `0`

## Critical Product Findings

The product asset tree is still mostly flat. Product images and documents should migrate from paths such as:

```text
/api/uploads/products/540ab6fa-639e-4aad-b863-95a921151980.jpg
/api/uploads/products/SOYAL_AR-837-E.png
/api/uploads/documents/4cddead4-47d9-43ff-944e-3267093d17e3.pdf
```

to canonical paths such as:

```text
/api/uploads/products/AR-837-E/images/AR-837-E_01_front.jpg
/api/uploads/products/AR-837-E/images/AR-837-E_02_angle.png
/api/uploads/products/AR-837-E/documents/AR-837-E_DM.pdf
```

## AR-837-E Migration Candidates

```text
/api/uploads/products/540ab6fa-639e-4aad-b863-95a921151980.jpg
-> /api/uploads/products/AR-837-E/images/AR-837-E_01_front.jpg

/api/uploads/products/9e6177a6-9094-4c02-abf5-eddc5babe52c.png
-> /api/uploads/products/AR-837-E/images/AR-837-E_02_angle.png

/api/uploads/products/8f26effe-108e-4984-abcc-41d70c21b522.png
-> /api/uploads/products/AR-837-E/images/AR-837-E_03_dimensions.png

/api/uploads/products/9b4ad5ac-f80c-4f9a-8f39-52fbed859309.png
-> /api/uploads/products/AR-837-E/images/AR-837-E_04_wiring.png

/api/uploads/products/943b67d7-9808-476c-9a35-1e1dba4c7359.png
-> /api/uploads/products/AR-837-E/images/AR-837-E_05_installation.png

/api/uploads/documents/4cddead4-47d9-43ff-944e-3267093d17e3.pdf
-> /api/uploads/products/AR-837-E/documents/AR-837-E_DM.pdf

/api/uploads/documents/e7434e1e-18f1-4bc8-8da9-9cfc477a5225.pdf
-> /api/uploads/products/AR-837-E/documents/AR-837-E_Manual.pdf
```

The two AR-837-E document source files are currently missing on disk, so they require restore or replacement before canonical migration can complete.

## Missing References

Active missing `uploaded_files` rows:

```text
/api/uploads/documents/4cddead4-47d9-43ff-944e-3267093d17e3.pdf
/api/uploads/documents/e7434e1e-18f1-4bc8-8da9-9cfc477a5225.pdf
```

Other missing referenced paths:

```text
/api/uploads/logo.png
/api/uploads/og-image.webp
/api/uploads/signatures/59d7f6e0-d5e3-4d19-a776-5d2bfc6ff0ee_1774254685272.png
/api/uploads/signatures/8c0d1569-6b83-482f-accb-2c4083438c74_1774242813458.png
/api/uploads/signatures/9a6d6fb0-e5d0-48c4-96c4-45c81e8adbaa_1775007881856.png
/api/uploads/signatures/f3954413-ead6-4267-ac7d-94deaeff0397_1773970524705.png
```

These should be triaged by type:

- product documents: restore, replace, or remove the document row
- source fallbacks: update fallback constants or add intentional default assets
- signatures: verify whether these quote signatures are still operationally required before cleanup

## Cleanup Guidance

The audit found `57` unreferenced filesystem files, including old downloads and flat product assets. These are cleanup candidates only.

Do not delete them directly. The next safe step is to implement a quarantine command that moves candidates to a dated non-public quarantine path, runs smoke checks and the audit again, and deletes only after the quarantine window passes without missing-reference findings.
