# Encoding Policy

This repository uses UTF-8 as the single source of truth for all text content.

## Scope

- Source files under `src/`, `prisma/`, and `scripts/`
- Repository docs maintained with the app workflow
- Seed and import scripts
- Database-backed copy such as settings, products, quotes, templates, and pages
- Generated output such as HTML, XML, and PDF content

## Rules

1. Save text files as UTF-8.
2. Do not trust terminal mojibake alone as proof that a file is corrupted.
3. Never copy garbled text from terminal output back into source files.
4. Prefer `apply_patch` for Chinese copy changes instead of bulk scripted replace.
5. Treat database-backed copy as a separate layer from source files.
6. Run encoding checks before merge and before deploy-sensitive text changes.

## Required Checks

- `npm run check:encoding`
- `npm run check:garbled-copy`
- `npm run check:garbled-db` for DB-backed copy changes
- `npm run check:text-integrity` for broader text/content work
- `npm run repair:garbled-db -- --table=... --id=... --column=... --from=... --to=...` for reviewed DB repairs

Repair reports are written to `tmp/garbled-db-reports/` by default so DB changes remain auditable.
Batch repair rules can start from `tmp/garbled-db-rules.example.json`.

## Incident Triage

When Chinese text looks wrong, follow this order:

1. Verify the source file encoding and literals.
2. Verify whether the data actually comes from the database.
3. Verify container-local output.
4. Verify public dev output.
5. Only then rewrite copy or run cleanup scripts.

## High-Risk Inputs

- Legacy seed/import scripts
- Manual SQL updates with embedded Chinese text
- Copy pasted text from PowerShell or other non-UTF-8 displays
- Database settings and product content imported from old systems

## Long-Term Maintenance

- Keep archive/legacy scripts out of the active maintenance path.
- Add new import scripts only after they use UTF-8 reads and text preflight checks.
- Expand DB scan coverage when new copy-heavy tables are added.
