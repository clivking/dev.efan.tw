# Legacy Asset Inventory

## Purpose

This file records which legacy materials are worth keeping, where they came from, and how we should treat them during the rebuild.

Rule:

- legacy material stays under `import-review/`
- anything from the old system keeps the `-old` naming
- old code is reference material first, not direct source for the new app

## Confirmed Useful Sources

### Database

Source:

- `import-review/db-old/efan_dev-old.sql`

Status:

- imported successfully into `efan-old-db`
- business data is readable and usable

Key tables confirmed:

- `customers`
- `contacts`
- `company_names`
- `quotes`
- `quote_items`
- `products`

Use in rebuild:

- reference for data shape
- source for migration planning
- source for content and product recovery

### Old Website Code

Source:

- `import-review/code-old/efan.tw-old/web`

Status:

- isolated old app can run on `http://localhost:3001`
- useful for behavior reference and content recovery

Use in rebuild:

- inspect routes, wording, API behavior, and feature scope
- do not copy directly into the new app without review

### Old Upload Assets

Primary source:

- `D:\Coding\efan.tw\backup\20260409-133424-dev\dev_uploads_20260409-133424.tar.gz`

Isolated review area:

- `import-review/code-old/efan.tw-old/dev-uploads-old`

Applied old app location:

- `import-review/code-old/efan.tw-old/web/public/uploads`

Status:

- confirmed as the most complete upload archive found so far
- restored missing product and settings images used by the old site

Important note:

- the older `2026-04-12 C槽備份` upload set was incomplete
- this `dev_uploads_20260409-133424.tar.gz` archive is the better recovery source

## Confirmed Less Useful Sources

### Old Ubuntu System Tar

Source:

- `D:\2026-04-12 C槽備份\ubuntu-22.04.tar`

Status:

- useful for selective extraction only
- not suitable for full environment recovery

Reason:

- brings too much old environment baggage
- not needed now that code, SQL, and upload assets have been recovered separately

### Old Public Folder Snapshot

Source:

- `D:\2026-04-12 C槽備份\2026-04-12 efan.tw\public`

Status:

- useful for static public assets and portfolio images
- not complete enough for uploads recovery

Reason:

- uploads inside this snapshot were incomplete compared with `dev_uploads_20260409-133424.tar.gz`

## Current Old-System Runtime

Legacy reference app:

- container: `efan-old-app`
- local URL: `http://localhost:3001`

Legacy reference database:

- container: `efan-old-db`
- database: `efan_dev_old`

Purpose:

- inspect old behavior safely
- recover content and assets
- validate assumptions before rebuilding in the new app

## Current Working Copy Runtime

Working codebase:

- `app-legacy-base`

Working containers:

- app: `efan-work-app`
- db: `efan-work-db`

Current local ports:

- app: `http://localhost:3001`
- db: `5433`

Status:

- this is now the editable working copy based on the old site
- the old isolated containers were temporary recovery tooling

## Rebuild Guidance

Keep:

- business data from `efan_dev-old.sql`
- uploads and product images from `dev_uploads_20260409-133424.tar.gz`
- static content and wording from old site pages

Reference only:

- old Next.js app structure
- old API behavior
- old admin flow

Do not directly reuse:

- old skills
- old environment assumptions
- old deployment flow
- old generated artifacts or build caches
