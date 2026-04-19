# Efan Upload Flow

## Goal

Define the long-term safe operating flow for backup, selective production-data sync, and release promotion across `dev.efan.tw`, `pre.efan.tw`, and `www.efan.tw`.

This runbook turns the current real-world workflow into a repeatable process that does not depend on machine memory.

## Core Rules

- code moves upward: `dev -> pre -> www`
- production business data moves downward: `www -> dev/pre`
- never overwrite `www` with `dev` or `pre` customer or quote data
- never restore the full `www` database onto `dev` if `dev` contains newer product or website content
- every stage transition starts with a backup
- every release must be traceable to a branch, commit, backup set, and rollback target

## Environment Roles

- `dev`: primary editing environment for products, website content, and implementation work
- `pre`: release-verification environment on Mac mini
- `www`: production environment and source of truth for live customers and quotes

## Data Ownership Model

### Dev-owned working data

These data areas may be newer in `dev` than in `www` and must not be erased by a sync-down:

- products and product categories
- website pages, guides, and content-like records
- environment-specific settings under active development
- local working uploads related to unreleased content

### Www-owned production data

These data areas are treated as production truth and are refreshed downward when needed:

- customers
- company names
- contacts
- locations
- quotes
- quote items
- quote contacts
- quote tokens and quote views
- quote signatures and quote variants
- payments

For the exact selective-sync table scope, see `CUSTOMER_QUOTE_SYNC_SCOPE.md`.

## Standard Five-Step Flow

1. create a full portable backup of `dev`
2. create a full portable backup of `www`
3. sync the approved customer and quote domain from `www` into `dev` without overwriting `dev` product/content data
4. promote the validated `dev` release candidate to `pre`
5. promote the same validated release candidate from `pre` to `www` without overwriting `www` production business data

## Step 1: Dev Full Backup

Create a backup under `/home/cliv/projects/backup-efan.tw/` with the format:

- directory name: `YYYYMMDD-HHMMSS-dev`

The backup package must include:

- repository snapshot or canonical source archive
- `dev` database dump
- `dev` uploads archive
- env and secret material needed to rebuild the environment
- compose and infrastructure files
- checksum list
- restore manifest with restore steps

Minimum expected shape:

```text
/home/cliv/projects/backup-efan.tw/YYYYMMDD-HHMMSS-dev/
  manifest.json
  restore-notes.md
  code/
  db/
  uploads/
  env/
  infra/
  checksums/
```

Restore intent:

- a new computer should be able to recreate `dev` from this backup package without relying on Docker volumes from the old machine

Current script entrypoint:

```bash
./scripts/backup-dev-portable.sh
```

## Step 2: Www Full Backup

Create a backup under `/home/cliv/projects/backup-efan.tw/` with the format:

- directory name: `YYYYMMDD-HHMMSS-www`

The backup package must include:

- production database dump
- production uploads archive
- production env and secrets inventory
- production compose and infrastructure files
- checksum list
- restore manifest with restore steps

This backup must complete successfully before:

- any selective `www -> dev` sync
- any `pre -> www` promotion

Current script entrypoint:

```bash
EFAN_WWW_REPO_PATH=/path/to/www-repo \
EFAN_WWW_DB_CONTAINER=efan-www-db \
EFAN_WWW_DB_USER=<user> \
EFAN_WWW_DB_NAME=<db_name> \
EFAN_WWW_UPLOADS_PATH=/path/to/www/uploads \
./scripts/backup-www-portable.sh
```

## Step 3: Selective Www To Dev Sync

This step is selective by design.

Do not restore the entire `www` database into `dev`.

Reason:

- `dev` can contain newer products and website content than `www`
- a full production DB restore would erase unreleased work in `dev`

### Step 3 Preconditions

Before sync:

1. finish Step 1 and Step 2 backups
2. confirm the incoming `www` snapshot date and time
3. confirm `ENCRYPTION_KEY` compatibility if any synced records depend on encrypted settings
4. confirm the selective-sync table scope from `CUSTOMER_QUOTE_SYNC_SCOPE.md`
5. run dependency checks for referenced `products`, `users`, and templates before applying quote-domain data

### Step 3 Safety Rule

The canonical target is:

- refresh only the customer and quote domain from `www`
- preserve `dev` product, website, and unreleased content data

### Step 3 Validation

After sync into `dev`, validate:

1. customer list loads
2. customer detail pages load
3. quote list loads
4. quote detail pages load
5. quote totals and items render correctly
6. product pages and unreleased product content still exist
7. uploads referenced by synced customer or quote records still resolve

The user confirms this step before moving to `pre`.

Current dependency-check entrypoint:

```bash
./scripts/check-customer-quote-sync-dependencies.sh
```

Current export/apply entrypoints:

```bash
./scripts/export-customer-quote-domain.sh \
  --source-db-container efan-www-db \
  --source-db-user <user> \
  --source-db-name <db_name>
```

```bash
./scripts/apply-customer-quote-domain.sh \
  --artifact /path/to/customer-quote-sync-www-YYYYMMDD-HHMMSS.sql.gz \
  --target-db-container efan-work-db \
  --target-db-user efan_work \
  --target-db-name efan_working_copy
```

Wrapper entrypoint:

```bash
./scripts/run-customer-quote-sync.sh \
  --artifact /path/to/customer-quote-sync-www-YYYYMMDD-HHMMSS.sql.gz \
  --dev-backup
```

## Step 4: Dev To Pre Release Promotion

This step promotes the current validated release candidate to `pre`.

### What Moves To Pre

- the intended source commit
- the intended runtime configuration for `pre`
- the validated `dev` release state needed for release testing

### Build Rule

`pre` runs on Mac mini, so the long-term safe default is:

- rebuild on the Mac host from the promoted source commit

Do not assume a Linux build artifact from `dev` should be copied directly to `pre`.

Reason:

- `dev` and `pre` differ by host architecture and runtime packaging expectations
- rebuilding on `pre` is safer than trusting a copied Linux artifact

### Step 4 Validation

After deploy to `pre`, validate:

1. homepage loads
2. admin login works
3. products and website content match the intended release
4. customer pages load
5. quote pages load
6. AI and Telegram integrations read settings without decryption errors
7. key uploads resolve

Current smoke-check entrypoint:

```bash
./scripts/run-release-smoke-checks.sh --env pre
```

Current deploy entrypoint:

```bash
EFAN_PRE_HOST=user@mac-mini \
EFAN_PRE_PATH=/srv/efan/pre-build-context \
EFAN_PRE_RUNTIME_PATH=/srv/efan/pre \
EFAN_PRE_COMPOSE_FILE=/srv/efan/pre/docker-compose.yml \
EFAN_PRE_BASE_URL=https://pre.efan.tw \
./scripts/deploy-to-pre.sh
```

Only after `pre` passes should the release move to `www`.

## Step 5: Pre To Www Release Promotion

This step promotes the same validated release candidate to production.

### Production Data Rule

This is a full application release, not a blind full-database overwrite.

Never replace `www` production customer or quote data with older `dev` or `pre` copies.

The production-safe target is:

- promote code and release-approved content changes
- preserve `www` as the source of truth for live customer and quote records

### Step 5 Validation

After deploy to `www`, validate:

1. homepage loads
2. admin login works
3. products and website content reflect the intended release
4. existing production customers still load
5. existing production quotes still load
6. uploads resolve
7. release record includes branch, commit, backup set, and rollback target

Current smoke-check entrypoint:

```bash
./scripts/run-release-smoke-checks.sh --env www
```

Current deploy entrypoint:

```bash
EFAN_WWW_HOST=user@mac-mini \
EFAN_WWW_PATH=/srv/efan/www \
EFAN_WWW_COMPOSE_FILE=compose.www.yaml \
EFAN_WWW_BASE_URL=https://www.efan.tw \
./scripts/deploy-to-www.sh
```

## Rollback Rule

If any stage fails:

1. stop the target app
2. restore the latest backup made immediately before that stage
3. restart the target app
4. confirm return to the last known-good state

Do not improvise rollback from memory.

## Long-Term Automation Targets

Later this flow should have canonical commands or scripts for:

- `dev` portable backup
- `www` portable backup
- selective `www -> dev` customer/quote sync
- `pre` release deploy
- `www` release deploy
- post-stage smoke checks
