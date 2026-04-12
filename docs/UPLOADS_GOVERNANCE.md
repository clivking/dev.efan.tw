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

Current reference audit:

- `docs/UPLOADS_AUDIT_2026-04-13.md`

### 3. Backup

Uploads must be backed up alongside DB snapshots when refreshing `pre` or `dev` from `www`.

Rule:

- if DB content is refreshed from production, the relevant uploads set must be refreshed from the same production period

### 4. Restore

Uploads restore must be treated as a separate controlled action from DB restore.

Reason:

- DB and uploads can each be valid on their own while still being inconsistent with each other

### 5. Environment Separation

- `dev` uploads are for development/runtime validation
- `pre` uploads are for release verification
- `www` uploads are the source of truth

Do not let ad hoc dev file changes become implicit production truth.

## Long-Term Target

- uploads backup and restore documented like DB backup and restore
- uploads integrity audit included in refresh checklist
- `pre` and `www` each have dedicated persistent uploads storage
- file naming and extension drift monitored instead of discovered manually
