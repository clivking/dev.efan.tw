# DB Backup, Restore, And Sync-Down Runbook

## Goal

Define the safe database flow for `www -> pre/dev` and make backup/restore repeatable.

## Core Rule

- code moves upward: `dev -> pre -> www`
- data moves downward: `www -> pre/dev`
- never overwrite `www` with `dev` or `pre` data

## Scope

This runbook covers:

- production backup
- restoring a snapshot into `pre`
- restoring a snapshot into `dev`
- encryption compatibility checks
- post-restore validation

## Environment Roles

- `www`: production source of truth
- `pre`: release validation with production-like data
- `dev`: development/testing copy using refreshed production-derived data when needed

## Preconditions

Before any restore:

1. confirm the target environment is not production
2. confirm the target DB container name
3. confirm the target app is using a compatible `ENCRYPTION_KEY`
4. confirm the operator knows which snapshot date is being restored
5. confirm the current target DB can be re-backed up before replacement

## Naming Convention

Recommended snapshot naming:

- `efan-www-YYYYMMDD-HHMM.sql.gz`
- `efan-pre-before-refresh-YYYYMMDD-HHMM.sql.gz`
- `efan-dev-before-refresh-YYYYMMDD-HHMM.sql.gz`

## Step 1: Create A Production Backup

Run from the host that contains the production DB container.

Suggested shape:

```bash
docker exec efan-www-db pg_dump -U <user> -d <db_name> | gzip > efan-www-YYYYMMDD-HHMM.sql.gz
```

Requirements:

- use a consistent DB user with dump permission
- store the snapshot outside the container
- keep the timestamp in the filename

## Step 2: Backup The Target Before Replacing It

Before restoring into `pre` or `dev`, back up that target first.

Example shape:

```bash
docker exec efan-pre-db pg_dump -U <user> -d <db_name> | gzip > efan-pre-before-refresh-YYYYMMDD-HHMM.sql.gz
```

Do the same for `dev` before replacing the working DB.

## Step 3: Check Encryption Compatibility

This is mandatory.

If the incoming DB snapshot contains encrypted settings:

- `ENCRYPTION_KEY` in the target environment must be compatible
- otherwise AI, Telegram, SMTP, and Turnstile secret reads will break after restore

Minimum check:

1. confirm the target env has the intended `ENCRYPTION_KEY`
2. restore only if that key is compatible with the source snapshot

If not compatible:

- stop
- do not restore yet
- plan either key alignment or encrypted-setting migration

## Step 4: Restore Into Pre Or Dev

General restore shape:

```bash
gunzip -c <snapshot.sql.gz> | docker exec -i <target-db-container> psql -U <user> -d <db_name>
```

Recommended safer sequence:

1. stop the target app container
2. restore the target DB
3. start the target app container
4. run post-restore validation

If a full reset is needed first, that should be done only on the target non-production DB.

## Current Dev Mapping

Current dev DB runtime:

- container: `efan-work-db`
- port: `5433`
- DB name: `efan_working_copy`
- compose file: `compose.work-prod.yaml`

Current production-like app runtime:

- app container: `efan-dev-web`
- hostname: `dev.efan.tw`

## Post-Restore Validation Checklist

After restoring into `pre` or `dev`, validate:

1. app starts successfully
2. homepage loads
3. admin login works
4. products list loads
5. customer pages load
6. quote pages load
7. AI test connection works if enabled
8. Telegram settings can be read without decryption errors
9. key uploaded images still resolve

## Recommended Smoke URLs

For `dev`:

- `https://dev.efan.tw`
- `/admin`
- `/products`

For `pre` later:

- `https://pre.efan.tw`
- `/admin`
- `/products`

## Rollback Rule

If the refresh breaks the target:

1. stop the target app
2. restore the target's pre-refresh backup
3. start the app again
4. confirm the target returns to the last known-good state

Do not improvise rollback from memory.

## Future Automation Targets

Later this runbook should become:

- one backup command per environment
- one target-refresh command for `pre`
- one target-refresh command for `dev`
- one post-restore smoke-check command

## Non-Goals

This runbook does not authorize:

- any `dev -> www` data push
- any `pre -> www` data push
- any production restore without an explicit production incident plan
