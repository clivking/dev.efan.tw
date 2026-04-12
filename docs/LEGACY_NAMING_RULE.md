# Legacy Naming Rule

To keep the rebuild clean, anything from the previous system must carry the suffix `-old`.

## Why

- makes old and new assets easy to distinguish
- reduces accidental imports into the live app
- keeps review work explicit

## Apply `-old` To

- restored databases
- temporary containers
- extracted legacy folders
- copied configuration files
- exported SQL, CSV, JSON, and media batches

## Examples

- `efan-old-db`
- `efan-old-app`
- `efan_dev_old`
- `import-review/db-old/`
- `import-review/code-old/`
- `schema-old.sql`

## Rule Of Thumb

If it came from the old system and has not been reviewed yet, it keeps `-old`.
