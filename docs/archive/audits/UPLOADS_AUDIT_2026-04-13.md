# Uploads Audit - April 13, 2026

## Scope

Audit source:

- filesystem: `app-legacy-base/public/uploads`
- database table: `uploaded_files`
- runtime check command: `docker exec efan-dev-web node scripts/check-uploads-integrity.mjs`

## Initial Summary

- filesystem files: `344`
- `uploaded_files` rows: `333`
- unsupported DB paths: `0`
- missing file paths on disk: `287`

## What The Initial Result Actually Meant

This does not appear to mean `287` files are truly gone.

The audit output shows many rows where:

- the DB points to `.webp`
- the actual file exists as `.jpg` or `.png`

So the current dominant issue is:

- extension drift between DB references and real files

## Observed Patterns

### Product records

Examples showed paths like:

- DB: `products/...webp`
- actual file: `products/...png`

### Product content image records

Examples showed paths like:

- DB: `products/...webp`
- actual file: `products/...jpg`

## Extension Drift Repair

A high-confidence extension-drift repair pass was run on April 13, 2026.

Tool:

- `app-legacy-base/scripts/fix-uploads-extension-drift.mjs`

Result:

- `238` `uploaded_files` rows were repaired
- these were exact same-basename matches where the DB path extension was wrong but the real file existed on disk

Breakdown:

- `product_website`: `214`
- `product_content_image`: `20`
- `product`: `4`

## Post-Repair Summary (After Extension Drift Pass)

After the repair pass:

- unsupported DB paths: `0`
- missing file paths on disk: `49`

## Document Mapping Repair

A second high-confidence repair pass was run for:

- decoded path cases where the real file existed on disk
- SOYAL manual-document rows that clearly map to existing `_DM.pdf` files

Tool:

- `app-legacy-base/scripts/fix-uploads-document-mappings.mjs`

Result:

- `11` rows repaired

Breakdown:

- `soyal-manual-to-dm`: `10`
- `decoded-path-exists`: `1`

## Current Remaining Gap

After both repair passes:

- unsupported DB paths: `0`
- missing file paths on disk: `38`

These remaining rows appear to be the true unresolved set.

### Current shape of the remainder

- `2` legacy product image references
- `9` remaining SOYAL product-document references with no matching `_DM.pdf`
- `27` ACTi product-document references with no matching local PDF file found

## Recovery From Www

A direct recovery pass from `https://www.efan.tw` was then executed against the still-missing local paths.

Result:

- `36` files were downloaded successfully from `www`
- `2` files still returned `404` from `www`

The two unresolved files are:

- `/api/uploads/products/a01f520c-d4d9-4880-bdb5-28c1a807db80.png` (`AR-837-E_2-1.png`)
- `/api/uploads/products/b5ce0735-977c-4a1a-9e52-bfa706f312e0.png` (`AR-721H_1-1.png`)

## Final Status For This Pass

After local repairs plus direct recovery from `www`:

- unsupported DB paths: `0`
- missing file paths on disk: `2`

Those final `2` rows are currently the true unresolved remainder.

## Orphan Record Cleanup

The final `2` missing image rows were confirmed to belong to a legacy orphan bucket:

- `entity_type = 'product'`
- `entity_id IS NULL`

Those rows were not part of the current product image pipeline, which uses:

- `product_website`
- `product_document`
- `product_content_image`

The orphan bucket contained `7` rows total and was removed from `uploaded_files`.

## Final Status After Cleanup

After orphan cleanup:

- `uploaded_files` rows: `326`
- unsupported DB paths: `0`
- missing file paths on disk: `0`

The uploads integrity audit is now clean.

## What The Remaining 49 Most Likely Mean

The remaining rows after the first pass no longer looked like simple extension drift.

Observed patterns:

- legacy product image references with no exact file match
- product document references that point to URL-encoded Chinese filenames
- actual filesystem documents often exist only as alternate manual/datasheet naming such as `_DM.pdf`

This means the remaining set likely needs:

- targeted document mapping decisions
- or true file recovery from backups

It should not be auto-fixed with the same extension-drift rule.

## Immediate Interpretation

1. uploads governance is now confirmed as a real maintenance area, not just a theoretical one
2. the biggest image-path problem was repairable by path normalization rather than file recovery
3. the remaining file issues are narrower and more semantic
4. current image/document health still cannot be trusted from DB references alone

## Recommended Next Action

1. keep using `check-uploads-integrity.mjs` as the canonical audit
2. treat future missing-file reports as new regressions, not historical baseline debt
3. continue with uploads backup and restore standardization

## Operational Note

Because the current runtime is image-based, the most reliable way to run this audit right now is:

```bash
docker exec efan-dev-web node scripts/check-uploads-integrity.mjs
```
