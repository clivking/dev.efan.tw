# Uploads Canonical Asset Plan

## Decision

Product uploads must become governed product assets, not a flat file dump.

Canonical product assets use the product model as the folder key, split images and documents into separate folders, and use filenames that carry both display order and business meaning.

## Canonical Product Paths

### Images

```text
/api/uploads/products/{MODEL}/images/{MODEL}_{NN}_{ROLE}.{ext}
```

Example for `AR-837-E`:

```text
/api/uploads/products/AR-837-E/images/AR-837-E_01_front.png
/api/uploads/products/AR-837-E/images/AR-837-E_02_angle.png
/api/uploads/products/AR-837-E/images/AR-837-E_03_dimensions.png
/api/uploads/products/AR-837-E/images/AR-837-E_04_wiring.png
/api/uploads/products/AR-837-E/images/AR-837-E_05_installation.png
```

### Documents

```text
/api/uploads/products/{MODEL}/documents/{MODEL}_{DOC_TYPE}.pdf
```

Example for `AR-837-E`:

```text
/api/uploads/products/AR-837-E/documents/AR-837-E_DM.pdf
/api/uploads/products/AR-837-E/documents/AR-837-E_Manual.pdf
/api/uploads/products/AR-837-E/documents/AR-837-E_Spec.pdf
```

## Naming Rules

- `{MODEL}` is the normalized product model used by the product asset folder.
- `{NN}` is a required two-digit display order.
- `{ROLE}` is a short semantic role.
- file extensions are lowercase.
- filenames use ASCII letters, digits, hyphen, underscore, and dot.
- spaces are not allowed in canonical public paths.
- Chinese or vendor-original names may be retained in metadata, but not in canonical public paths.
- UUID filenames are legacy paths only after migration starts.

Recommended image roles:

```text
front
angle
dimensions
wiring
installation
detail
accessory
package
comparison
```

Recommended document types:

```text
DM
Manual
Spec
Wiring
Installation
Certificate
Firmware
Software
```

## Database Metadata

The path should be human-readable, but business logic must not depend only on parsing filenames.

Each product asset should retain structured metadata:

```text
entity_type: product_image | product_document
entity_id: product id
filepath: canonical public path
filename: canonical filename
original_filename: original uploaded filename, when available
asset_role: front | angle | dimensions | wiring | installation | DM | Manual | Spec
sort_order: numeric display order
checksum: sha256 of the stored file
is_legacy_alias: false for canonical paths
```

If the existing schema cannot hold every field yet, keep the canonical path and `sort_order` first, then add missing metadata fields in a later migration.

## Migration Phases

### Implemented Baseline

As of April 19, 2026:

- product website image uploads write new files through the canonical product image path helper
- product content image uploads write new files through the canonical product image path helper
- product document uploads from the admin product form post directly to the product documents endpoint and write canonical document paths
- the legacy generic `/api/upload/document` endpoint remains available only for older callers that do not yet know the target product
- `audit-canonical-uploads.mjs` provides read-only inventory, missing-reference, cleanup-candidate, and canonical-violation reporting

### Phase 1: Inventory

Create an asset inventory that joins:

- `uploaded_files.filepath`
- product model and `seo_slug`
- settings upload paths
- rich content and JSON content upload references
- static source references under `src`
- filesystem files under `public/uploads`

The inventory must classify each file or reference as:

```text
referenced
missing_on_disk
unreferenced_on_disk
duplicate_candidate
legacy_flat_product_asset
canonical_product_asset
```

Current audit command:

```bash
docker exec efan-dev-web npm run script:audit-canonical-uploads -- --json-out=/tmp/canonical-uploads-audit.json
```

The audit is read-only. It must not move, rename, update, quarantine, or delete files.

Current safe migration command:

```bash
docker exec efan-dev-web npm run script:migrate-canonical-product-assets -- --report=/tmp/canonical-uploads-audit.json
docker exec efan-dev-web npm run script:migrate-canonical-product-assets -- --report=/tmp/canonical-uploads-audit.json --apply
```

The migration script copies files to canonical paths, verifies checksums, updates `uploaded_files`, and skips missing sources, duplicate targets, or existing targets with different content.

### Phase 2: New Uploads Only

Before moving old files, update upload endpoints and admin workflows so every new product asset is written to the canonical path.

Rules:

- product website images go to `products/{MODEL}/images/`
- product documents go to `products/{MODEL}/documents/`
- uploads must fail if `{MODEL}` cannot be resolved safely
- uploads must fail if the target filename would overwrite an existing canonical asset unless the user explicitly replaces that asset

### Phase 3: Legacy Asset Migration

Generate a migration plan before moving files.

The plan format should be:

```text
old_path
new_path
product_id
product_model
asset_role
sort_order
checksum_before
action
```

Allowed actions:

```text
copy_and_update_db
keep_as_alias
quarantine_candidate
manual_review
```

Migration must:

1. copy the file to the new canonical path
2. verify checksum after copy
3. update DB references
4. keep the old path readable for one release cycle when public links may exist
5. remove old aliases only after the audit is clean

### Phase 4: Cleanup

Unused files and folders can be deleted only after quarantine.

Required cleanup path:

```text
public/uploads/.quarantine/{YYYYMMDD}/...
```

The quarantine directory should not be publicly served. If this cannot be guaranteed, place quarantine outside `public/uploads`.

Cleanup rules:

- do not delete during the same run that first marks a file unused
- do not delete a file if it appears in any DB, settings, rich content, JSON, or source reference
- do not delete a product model folder if the product still exists and expects canonical assets
- remove empty folders after file deletion and after canonical path checks pass

## Deployment Gates

The public dev service must not be considered healthy unless:

- `/app/public/uploads` is the expected bind mount, not an empty temporary filesystem
- uploads file count is above the expected minimum
- company logo resolves with HTTP 200
- favicon resolves with HTTP 200
- homepage product images resolve with HTTP 200
- DB upload references have zero missing public product images
- DB upload references have zero missing settings images

Document and PDF gaps may be allowed temporarily only when explicitly listed in the release notes with an owner and cleanup date.

## Cache Policy

Development:

```text
/api/uploads/* -> no-store or short cache
404 responses -> no-store
```

Production:

```text
canonical asset paths -> cacheable with versioning
404 responses -> no-store
```

If canonical filenames can be replaced, production URLs should include a version value from checksum or updated timestamp.

Example:

```text
/api/uploads/products/AR-837-E/images/AR-837-E_01_front.png?v=checksum8
```

## No Temporary Repair Rule

Temporary repair is not an operating model.

Allowed repairs:

- scripted migration
- admin workflow that writes canonical paths
- documented restore from a matching DB/uploads backup pair
- audited quarantine cleanup

Disallowed repairs:

- editing random DB file paths without a migration record
- copying files into flat folders to satisfy one broken URL
- recreating containers without a mount health check as the only fix
- deleting apparently unused files without a reference inventory

## Success Criteria

The canonical uploads project is complete when:

- new product uploads never create flat `/api/uploads/products/{filename}` assets
- product image filenames include both order and semantic role
- product documents live under the product model folder
- the uploads audit reports zero missing critical image references
- unreferenced files are either quarantined or deleted through an audit trail
- deployment fails before public traffic when uploads are not mounted correctly
- dev, pre, and www have separate persistent uploads roots and documented backup pairs
