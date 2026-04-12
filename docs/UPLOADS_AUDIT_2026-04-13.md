# Uploads Audit - April 13, 2026

## Scope

Audit source:

- filesystem: `app-legacy-base/public/uploads`
- database table: `uploaded_files`
- runtime check command: `docker exec efan-dev-web node scripts/check-uploads-integrity.mjs`

## Summary

- filesystem files: `344`
- `uploaded_files` rows: `333`
- unsupported DB paths: `0`
- missing file paths on disk: `287`

## What The Result Actually Means

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

## Immediate Interpretation

1. uploads governance is now confirmed as a real maintenance area, not just a theoretical one
2. many image problems are likely repairable by path normalization rather than file recovery
3. current image health cannot be trusted from DB references alone

## Recommended Next Action

1. classify missing rows into:
   - alternate extension exists
   - truly missing file
2. repair the alternate-extension cases in batches
3. only search backups for the truly missing remainder

## Operational Note

Because the current runtime is image-based, the most reliable way to run this audit right now is:

```bash
docker exec efan-dev-web node scripts/check-uploads-integrity.mjs
```
