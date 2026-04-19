# Uploads Governance

## Goal

Treat `public/uploads` as governed runtime data rather than an informal file dump.

## Current Reality

As observed on April 13, 2026:

- uploads live at `app-legacy-base/public/uploads`
- the directory is mounted into the running app container
- the directory size is about `689 MB`
- the directory currently contains `344` files

This is already large enough that manual checking is not reliable.

## Current Runtime Pattern

- app container path: `/app/public/uploads`
- host path: `app-legacy-base/public/uploads`
- public URLs typically resolve through `/api/uploads/...`
- DB file references are stored in `uploaded_files.filepath`

## Risks

1. DB points to files that do not exist on disk
2. files exist on disk but are no longer referenced
3. extension drift such as `.webp` in DB while the actual file is `.jpg`
4. no formal backup and restore record for uploads
5. uploads are currently environment-local and not yet standardized across `dev`, `pre`, and `www`
6. product assets use mixed flat paths, UUID filenames, and human filenames, making long-term maintenance and restore checks harder than necessary

## Required Controls

### 1. Inventory

- know how many files exist
- know total size
- know major content groups such as `products`, `downloads`, `customers`, and `settings`

### 2. Integrity Audit

Use:

```bash
docker exec efan-dev-web node scripts/check-uploads-integrity.mjs
```

This should verify:

- DB file references are in a supported uploads path format
- referenced files exist on disk
- likely alternate-extension mismatches are surfaced

For high-confidence extension drift:

```bash
docker exec efan-dev-web node scripts/fix-uploads-extension-drift.mjs
docker exec efan-dev-web node scripts/fix-uploads-extension-drift.mjs --apply
```

Rule:

- run dry-run first
- only apply exact same-basename alternate-extension repairs with an existing file on disk
- never use one-off manual path edits as the normal repair method; every repair must be repeatable through a script, migration plan, or admin workflow

Current reference audit:

- `docs/UPLOADS_AUDIT_2026-04-13.md`

### 3. Canonical Product Asset Paths

Product assets should be organized by product model, then by asset class.

Required product image pattern:

```text
/api/uploads/products/{MODEL}/images/{MODEL}_{NN}_{ROLE}.png
```

Example:

```text
/api/uploads/products/AR-837-E/images/AR-837-E_01_front.png
/api/uploads/products/AR-837-E/images/AR-837-E_02_angle.png
/api/uploads/products/AR-837-E/images/AR-837-E_03_dimensions.png
/api/uploads/products/AR-837-E/images/AR-837-E_04_wiring.png
/api/uploads/products/AR-837-E/images/AR-837-E_05_installation.png
```

Required product document pattern:

```text
/api/uploads/products/{MODEL}/documents/{MODEL}_{DOC_TYPE}.pdf
```

Example:

```text
/api/uploads/products/AR-837-E/documents/AR-837-E_DM.pdf
/api/uploads/products/AR-837-E/documents/AR-837-E_Manual.pdf
/api/uploads/products/AR-837-E/documents/AR-837-E_Spec.pdf
```

Rules:

- `{MODEL}` is the normalized product model used for the product asset folder.
- `{NN}` is a two-digit display order and is required even when the role is descriptive.
- `{ROLE}` describes the image purpose, such as `front`, `angle`, `dimensions`, `wiring`, or `installation`.
- product images and product documents must not be stored directly under `/api/uploads/products/` after the canonical migration is active.
- UUID filenames may be kept only as legacy read aliases during migration, not as the long-term canonical path.
- original upload filenames should remain in database metadata when useful, but the public canonical path should use the normalized model naming rule.

### 4. Unused File Cleanup

Unused files and empty folders should be removed, but only through a controlled cleanup workflow.

Required workflow:

1. generate a full reference inventory from DB fields, settings, rich content, and static source references
2. compare referenced paths against files under `public/uploads`
3. classify files as referenced, missing, unreferenced, duplicate, or legacy alias
4. move unreferenced files to a dated quarantine folder outside the public uploads tree
5. run the website smoke checks and uploads integrity audit
6. delete quarantined files only after the quarantine window passes with no missing-reference findings
7. remove empty folders after their files are deleted and after no canonical path rule expects the folder

Rule:

- do not permanently delete a file solely because `uploaded_files` does not reference it; settings, rich content, pages, hardcoded seed data, and static UI can also reference uploads.
- deletion must be auditable and reversible during the quarantine window.

### 5. Backup

Uploads must be backed up alongside DB snapshots when refreshing `pre` or `dev` from `www`.

Rule:

- if DB content is refreshed from production, the relevant uploads set must be refreshed from the same production period

### 6. Restore

Uploads restore must be treated as a separate controlled action from DB restore.

Reason:

- DB and uploads can each be valid on their own while still being inconsistent with each other

### 7. Environment Separation

- `dev` uploads are for development/runtime validation
- `pre` uploads are for release verification
- `www` uploads are the source of truth

Do not let ad hoc dev file changes become implicit production truth.

## Long-Term Target

- uploads backup and restore documented like DB backup and restore
- uploads integrity audit included in refresh checklist
- `pre` and `www` each have dedicated persistent uploads storage
- file naming and extension drift monitored instead of discovered manually
- new product assets use canonical model folders with ordered semantic image filenames
- unused file cleanup is performed by an auditable quarantine-and-delete workflow, not by manual guessing
- deployment fails before public traffic if the uploads mount, logo, product images, or DB-to-filesystem integrity checks fail
