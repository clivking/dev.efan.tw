# Scripts

Repeatable helper scripts live here.

Current release-flow helpers:

- `backup-dev-portable.sh`: create a portable `dev` backup package under `/home/cliv/projects/backup-efan.tw`
- `backup-www-portable.sh`: create a portable `www` backup package under `/home/cliv/projects/backup-efan.tw` or an explicit override
- `export-customer-quote-domain.sh`: export the selective customer/quote domain from `www` or another source DB
- `apply-customer-quote-domain.sh`: apply a selective customer/quote domain artifact onto the target DB
- `run-customer-quote-sync.sh`: one-command wrapper for Step 3 backup, apply, and smoke-check flow
- `run-release-smoke-checks.sh`: lightweight HTTP smoke checks for `dev`, `pre`, or `www`
- `deploy-release.sh`: generic remote source deploy with remote rebuild and release manifest
- `deploy-to-pre.sh`: wrapper for the `dev -> pre` release promotion
- `deploy-to-www.sh`: wrapper for the `pre/dev -> www` release promotion
- `create-portable-backup.sh`: shared portable-backup implementation
- `check-customer-quote-sync-dependencies.sh`: validate quote-domain dependency integrity before or after selective sync
- `check-customer-quote-sync-dependencies.sql`: SQL checks used by the dependency validator
- `customer-quote-sync-primary-tables.txt`: canonical primary table scope for Step 3 selective sync
