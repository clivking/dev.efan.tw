# Text Data Flow

This project has two independent text layers that must both stay clean:

1. Source-controlled copy in the repository
2. Database-backed copy created by settings, products, templates, quotes, and pages

## Flow

1. External source or teammate input arrives
2. Import or seed script normalizes and validates the text
3. Clean text is written to source files or database records
4. The app renders the text into HTML, API responses, or PDFs
5. Validation checks confirm the rendered output remains clean

## Risk Boundaries

- Fixing a source file does not clean polluted DB rows
- Fixing a DB row does not repair a bad import script
- Garbled terminal output alone does not prove persisted corruption

## Operational Rule

For text or encoding incidents, always identify the active source of truth before editing:

- Source file
- Persisted database row
- Generated output

Do not patch the wrong layer.
