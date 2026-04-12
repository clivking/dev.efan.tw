# Next Steps

## Milestone 1

Create the clean local baseline for `dev.efan.tw`.

## Decisions To Make First

1. app framework
2. package manager
3. database engine
4. deployment style

## Default Recommendation

If no old-code constraint forces a different choice:

- framework: `Next.js`
- language: `TypeScript`
- package manager: `pnpm`
- database: `PostgreSQL`
- runtime: `Docker Compose`

## Why This Default

- easy local development inside WSL2
- clean path to containerized deployment on Mac mini
- mature ecosystem
- good fit for both content site and internal business features

## After The Stack Is Confirmed

We build these in order:

1. app skeleton
2. local Docker setup
3. environment variable template
4. Git baseline files
5. import-review area for old backups

## Current Recommended Next Step

Now that the old system has been isolated and reviewed, the recommended next step is:

1. document legacy assets that are worth keeping
2. start rebuilding the `products` slice in the new app
3. import product images and product content deliberately
4. leave old business flows in `code-old` as reference only
